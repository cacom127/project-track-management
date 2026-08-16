from fastapi import APIRouter, Depends

from app.core.db import DBSession, get_db_session

router = APIRouter()


@router.get("/health")
def health_check(db: DBSession = Depends(get_db_session)) -> dict[str, str]:
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"status": "ok", "db": db_status}
