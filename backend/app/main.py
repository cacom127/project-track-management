import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.health import router as health_router

app = FastAPI(title="project-track-api")

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
