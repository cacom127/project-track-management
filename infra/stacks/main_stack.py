from aws_cdk import Stack
from aws_cdk import aws_cognito as cognito
from constructs import Construct


class MainStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.user_pool = self._create_user_pool()
        self.user_pool_client = self._create_user_pool_client()
        self._create_admin_group()

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
