from aws_cdk import Stack
from constructs import Construct


class MainStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        # Resource thật (Lambda, Aurora, Cognito, S3, CloudFront) sẽ thêm
        # ở ticket deploy AWS riêng, sau khi có ít nhất 1 module nghiệp
        # vụ sẵn sàng. Stack này hiện chưa chứa resource nào.
