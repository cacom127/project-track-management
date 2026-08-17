import os

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.projects.routes import router as projects_router
from app.routers.health import router as health_router

app = FastAPI(title="project-track-api")


# ERR-02 (specs/cross-cutting/error-handling.md): lỗi validate input trả
# 400, không dùng mặc định 422 của FastAPI — áp dụng cho MỌI route có
# request body, không riêng module nào (xem CHANGE-007 PROJ-06/07/08).
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=400, content={"detail": jsonable_encoder(exc.errors())}
    )

# Trên Lambda, CORS (kể cả preflight OPTIONS) do API Gateway lo
# (`cors_preflight` trong CDK, xem CHANGE-005 AUTH-12/13) — thêm
# CORSMiddleware ở đây nữa sẽ set trùng header
# Access-Control-Allow-Origin cho request thật, khiến trình duyệt từ
# chối response. `AWS_LAMBDA_FUNCTION_NAME` do Lambda runtime tự set,
# không có ở local dev (uvicorn chạy trực tiếp, không qua API Gateway
# nên vẫn cần middleware này).
if not os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(health_router)
app.include_router(projects_router)
