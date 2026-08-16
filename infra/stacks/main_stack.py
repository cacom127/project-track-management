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
        # Route mặc định ($default) forward MỌI request sang Lambda,
        # KHÔNG gắn authorizer ở tầng API Gateway — FastAPI/Mangum tự lo
        # routing bên trong 1 Lambda-lith (đúng ARCH-02). `/health` nhờ
        # vậy public, không cần JWT.
        return apigwv2.HttpApi(
            self,
            "HttpApi",
            default_integration=apigwv2_integrations.HttpLambdaIntegration(
                "BackendIntegration", self.backend_function
            ),
        )

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
