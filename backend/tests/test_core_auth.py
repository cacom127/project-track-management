import base64
import json

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.core.auth import get_current_user_id


def _make_request(
    *, headers: dict[str, str] | None = None, aws_event: dict | None = None
) -> Request:
    scope = {
        "type": "http",
        "headers": [
            (k.lower().encode(), v.encode()) for k, v in (headers or {}).items()
        ],
    }
    if aws_event is not None:
        scope["aws.event"] = aws_event
    return Request(scope)


def _fake_jwt(payload: dict) -> str:
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    header = _b64(json.dumps({"alg": "none"}).encode())
    body = _b64(json.dumps(payload).encode())
    return f"{header}.{body}.signature"


def test_uses_aws_event_claims_when_running_on_lambda():
    request = _make_request(
        aws_event={
            "requestContext": {
                "authorizer": {"jwt": {"claims": {"sub": "user-123", "email": "a@b.com"}}}
            }
        }
    )

    assert get_current_user_id(request) == "user-123"


def test_decodes_bearer_token_when_no_aws_event_local_dev():
    token = _fake_jwt({"sub": "user-456", "email": "x@y.com"})
    request = _make_request(headers={"Authorization": f"Bearer {token}"})

    assert get_current_user_id(request) == "user-456"


def test_raises_401_when_no_token_available():
    request = _make_request()

    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(request)
    assert exc_info.value.status_code == 401
