"""Lấy Cognito `sub` của user hiện tại từ request đã qua JWT Authorizer.

Ghi chú kiến trúc (áp dụng cho MỌI route cần biết "ai đang gọi", không
riêng module `projects` — xem `changes/_archive/CHANGE-007-.../delta-spec.md`):

- **Production** (Lambda qua Mangum, sau API Gateway JWT Authorizer):
  JWT đã được API Gateway verify chữ ký TRƯỚC khi forward request —
  claims có sẵn trong Lambda event, Mangum giữ nguyên event gốc ở
  `request.scope["aws.event"]`. Không cần verify lại chữ ký ở đây.
- **Local dev** (uvicorn chạy trực tiếp, không qua API Gateway): không
  có `aws.event` — decode thẳng payload JWT từ header `Authorization`
  MÀ KHÔNG verify chữ ký (không có ranh giới bảo mật thật ở local dev),
  cùng cách tiếp cận với `decodeIdToken()` phía frontend
  (`frontend/src/lib/auth.ts`).
"""

import base64
import json

from fastapi import HTTPException, Request


def get_current_user_id(request: Request) -> str:
    aws_event = request.scope.get("aws.event")
    if aws_event is not None:
        claims = aws_event["requestContext"]["authorizer"]["jwt"]["claims"]
        return claims["sub"]

    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Thiếu hoặc sai định dạng token")

    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload_b64 = token.split(".")[1]
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        return payload["sub"]
    except (IndexError, ValueError, KeyError) as exc:
        raise HTTPException(status_code=401, detail="Token không hợp lệ") from exc
