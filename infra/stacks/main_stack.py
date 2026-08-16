from aws_cdk import RemovalPolicy, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_rds as rds
from aws_cdk import aws_s3 as s3
from constructs import Construct


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
                version=rds.AuroraPostgresEngineVersion.VER_16_4
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
