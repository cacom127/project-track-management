import jsii
from aws_cdk import CfnOutput, Duration, RemovalPolicy, Stack
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_authorizers as apigwv2_authorizers
from aws_cdk import aws_apigatewayv2_integrations as apigwv2_integrations
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_rds as rds
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_deployment as s3_deployment
from aws_cdk.aws_lambda_python_alpha import BundlingOptions, ICommandHooks, PythonFunction
from constructs import Construct

# (1) Đã có sẵn trong Lambda Python runtime — không cần bundle vào gói
# deploy (giảm size, xem ghi chú tại _create_backend_function).
_RUNTIME_PROVIDED_PACKAGE_GLOBS = [
    "boto3",
    "boto3-*",
    "botocore",
    "botocore-*",
    "s3transfer",
    "s3transfer-*",
    "jmespath",
    "jmespath-*",
    "dateutil",
    "python_dateutil-*",
    "urllib3",
    "urllib3-*",
    "six.py",
    "six-*",
]

# (2) Chỉ cần cho `uvicorn` chạy server local (uvicorn[standard] extras)
# — trên Lambda, Mangum gọi thẳng FastAPI app, KHÔNG bao giờ chạy
# uvicorn thật (không có import uvicorn ở đâu trong app/), nên toàn bộ
# nhóm này là dead weight trên production.
_LOCAL_DEV_ONLY_SERVER_PACKAGE_GLOBS = [
    "uvicorn",
    "uvicorn-*",
    "uvloop",
    "uvloop.libs",
    "uvloop-*",
    "httptools",
    "httptools-*",
    "watchfiles",
    "watchfiles-*",
    "websockets",
    "websockets-*",
    "yaml",
    "_yaml",
    "pyyaml-*",
]


@jsii.implements(ICommandHooks)
class _StripLambdaUnnecessaryPackages:
    """Xoá 2 nhóm package không cần thiết khỏi gói Lambda sau khi `uv
    sync` cài xong (`asset_excludes` không dùng được ở đây vì nó chỉ lọc
    lúc COPY SOURCE vào container, không lọc package MỚI CÀI bên trong):
    (1) package đã có sẵn trong Lambda runtime (boto3...), (2) package
    chỉ phục vụ chạy `uvicorn` server local, không dùng trên Lambda."""

    def before_bundling(self, input_dir: str, output_dir: str) -> list[str]:
        return []

    def after_bundling(self, input_dir: str, output_dir: str) -> list[str]:
        # KHÔNG quote path — pattern có "*" cần shell glob-expand, quote
        # sẽ vô hiệu hoá wildcard (rm -rf tìm đúng tên file "boto3-*").
        all_globs = _RUNTIME_PROVIDED_PACKAGE_GLOBS + _LOCAL_DEV_ONLY_SERVER_PACKAGE_GLOBS
        targets = " ".join(f"{output_dir}/{p}" for p in all_globs)
        return [f"rm -rf {targets}"]


class MainStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.user_pool = self._create_user_pool()
        self.user_pool_client = self._create_user_pool_client()
        self._create_admin_group()

        self.vpc = self._create_vpc()
        self.db_cluster = self._create_aurora_cluster()

        self.attachments_bucket = self._create_attachments_bucket()
        self.frontend_bucket = self._create_frontend_bucket()
        self.distribution = self._create_cloudfront_distribution()

        self.backend_function = self._create_backend_function()
        self.jwt_authorizer = self._create_jwt_authorizer()
        self.http_api = self._create_http_api()

        self._deploy_frontend()
        self._create_outputs()

    def _create_user_pool(self) -> cognito.UserPool:
        return cognito.UserPool(
            self,
            "UserPool",
            user_pool_name="project-track-users",
            self_sign_up_enabled=False,
            sign_in_aliases=cognito.SignInAliases(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
            ),
            # Không bắt ký tự đặc biệt (khác mặc định CDK) — message lỗi
            # tiếng Nhật ở FE (CHANGE-005, AUTH-14) chỉ giải thích
            # hoa/thường/số để dễ hiểu cho người dùng không rành kỹ thuật.
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_uppercase=True,
                require_lowercase=True,
                require_digits=True,
                require_symbols=False,
            ),
        )

    def _create_user_pool_client(self) -> cognito.UserPoolClient:
        return cognito.UserPoolClient(
            self,
            "UserPoolClient",
            user_pool=self.user_pool,
            generate_secret=False,
            auth_flows=cognito.AuthFlow(
                user_srp=True,
                user_password=False,
            ),
            # 4 giờ thay vì mặc định 1 giờ (CHANGE-005, AUTH-03) — giảm
            # tần suất phải đăng nhập lại trong ngày làm việc.
            id_token_validity=Duration.hours(4),
            access_token_validity=Duration.hours(4),
        )

    def _create_admin_group(self) -> cognito.CfnUserPoolGroup:
        return cognito.CfnUserPoolGroup(
            self,
            "AdminGroup",
            user_pool_id=self.user_pool.user_pool_id,
            group_name="admin",
            description="Full quyền — quản lý dữ liệu của người khác",
        )

    def _create_vpc(self) -> ec2.Vpc:
        # Chỉ subnet isolated (không NAT gateway) — Lambda dùng RDS Data
        # API (không cần networking trong VPC này), VPC chỉ để đặt
        # Aurora cluster.
        return ec2.Vpc(
            self,
            "Vpc",
            max_azs=2,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        return rds.DatabaseCluster(
            self,
            "AuroraCluster",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_16_13
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            credentials=rds.Credentials.from_generated_secret("app"),
            default_database_name="app",
            serverless_v2_min_capacity=0,
            serverless_v2_max_capacity=1,
            writer=rds.ClusterInstance.serverless_v2("Writer"),
            enable_data_api=True,
        )

    def _create_attachments_bucket(self) -> s3.Bucket:
        # Private hoàn toàn — không qua CloudFront, backend cấp
        # presigned URL để đọc/ghi (theo ARCH-06).
        return s3.Bucket(
            self,
            "AttachmentsBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
        )

    def _create_frontend_bucket(self) -> s3.Bucket:
        # Private — chỉ CloudFront (qua Origin Access Control) đọc được,
        # không public trực tiếp.
        return s3.Bucket(
            self,
            "FrontendBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

    def _create_cloudfront_distribution(self) -> cloudfront.Distribution:
        return cloudfront.Distribution(
            self,
            "FrontendDistribution",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(
                    self.frontend_bucket
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            ),
            # SPA: route không tồn tại (client-side routing) vẫn trả về
            # index.html thay vì lỗi 403/404 từ S3.
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                ),
            ],
        )

    def _create_backend_function(self) -> PythonFunction:
        fn = PythonFunction(
            self,
            "BackendFunction",
            entry="../backend",
            runtime=_lambda.Runtime.PYTHON_3_12,
            index="app/lambda_handler.py",
            handler="handler",
            timeout=Duration.seconds(29),
            memory_size=512,
            # `.venv` là bản build tạm của bước cài dependency (uv sync)
            # — sau khi công cụ copy phần cần dùng ra dạng "phẳng" đúng
            # chuẩn Lambda, `.venv` gốc không còn cần nữa (copy thừa,
            # ~126MB, suýt chạm giới hạn 250MB unzipped của Lambda).
            # `boto3`/`botocore` (+ dependency riêng: s3transfer, jmespath,
            # python-dateutil, urllib3, six) đã có sẵn trong Lambda Python
            # runtime — xoá khỏi gói sau khi bundle (command_hooks) để
            # giảm thêm ~28MB. Đánh đổi: dùng đúng version boto3 mà AWS
            # cài sẵn trong runtime (không tự pin được) — chấp nhận vì
            # chỉ dùng API ổn định (execute_statement).
            bundling=BundlingOptions(
                asset_excludes=[".venv", ".pytest_cache", ".ruff_cache", "tests"],
                command_hooks=_StripLambdaUnnecessaryPackages(),
            ),
            environment={
                "DB_BACKEND": "data-api",
                "DB_CLUSTER_ARN": self.db_cluster.cluster_arn,
                "DB_SECRET_ARN": self.db_cluster.secret.secret_arn,
                "DB_NAME": "app",
                "CORS_ORIGINS": f"https://{self.distribution.domain_name}",
            },
        )
        self.db_cluster.grant_data_api_access(fn)
        self.attachments_bucket.grant_read_write(fn)
        return fn

    def _create_jwt_authorizer(self) -> apigwv2_authorizers.HttpJwtAuthorizer:
        # Sẵn sàng cho các route nghiệp vụ sau này (vd /projects) — route
        # nào cần đăng nhập thì gắn authorizer này. `/health` (mục
        # _create_http_api) KHÔNG dùng authorizer — health-check cần
        # public để công cụ giám sát gọi được mà không cần token.
        return apigwv2_authorizers.HttpJwtAuthorizer(
            "CognitoAuthorizer",
            jwt_issuer=(
                f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool.user_pool_id}"
            ),
            jwt_audience=[self.user_pool_client.user_pool_client_id],
        )

    def _create_http_api(self) -> apigwv2.HttpApi:
        # KHÔNG dùng default_integration ($default) nữa (CHANGE-005) —
        # HttpApi không áp được authorizer chọn lọc lên $default, nên
        # phải khai báo route tường minh: /health public, các route còn
        # lại bắt buộc JWT (AUTH-04, AUTH-05).
        #
        # cors_preflight: để API Gateway tự trả lời OPTIONS (preflight)
        # KHÔNG qua authorizer/Lambda — nếu không, trình duyệt gửi
        # OPTIONS (không kèm Authorization) sẽ bị JWT Authorizer chặn
        # 401, làm hỏng CORS cho mọi API cần login (AUTH-12).
        api = apigwv2.HttpApi(
            self,
            "HttpApi",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=[f"https://{self.distribution.domain_name}"],
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                allow_headers=["Authorization", "Content-Type"],
            ),
        )
        integration = apigwv2_integrations.HttpLambdaIntegration(
            "BackendIntegration", self.backend_function
        )
        api.add_routes(
            path="/health",
            methods=[apigwv2.HttpMethod.GET],
            integration=integration,
        )
        api.add_routes(
            path="/{proxy+}",
            # KHÔNG dùng HttpMethod.ANY — nó bao gồm cả OPTIONS, khiến
            # route tường minh (có authorizer) chiếm quyền xử lý OPTIONS
            # thay vì để API Gateway tự trả lời preflight qua
            # cors_preflight ở trên. Hậu quả: mọi preflight bị 401 vì
            # trình duyệt không gửi Authorization kèm OPTIONS (phát
            # hiện qua curl thật sau khi deploy — xem CHANGE-005 T10).
            methods=[
                apigwv2.HttpMethod.GET,
                apigwv2.HttpMethod.POST,
                apigwv2.HttpMethod.PUT,
                apigwv2.HttpMethod.PATCH,
                apigwv2.HttpMethod.DELETE,
                apigwv2.HttpMethod.HEAD,
            ],
            integration=integration,
            authorizer=self.jwt_authorizer,
        )
        return api

    def _deploy_frontend(self) -> None:
        # `frontend/dist` phải build sẵn trước khi `cdk deploy` (npm run
        # build) — CDK chỉ copy file có sẵn lên S3 + invalidate CloudFront,
        # không tự build.
        s3_deployment.BucketDeployment(
            self,
            "DeployFrontend",
            sources=[s3_deployment.Source.asset("../frontend/dist")],
            destination_bucket=self.frontend_bucket,
            distribution=self.distribution,
            distribution_paths=["/*"],
        )

    def _create_outputs(self) -> None:
        CfnOutput(self, "ApiUrl", value=self.http_api.api_endpoint)
        CfnOutput(self, "FrontendUrl", value=f"https://{self.distribution.domain_name}")
        CfnOutput(self, "UserPoolId", value=self.user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=self.user_pool_client.user_pool_client_id)
