"""Fixture dùng chung cho test cần DB thật (Postgres local qua
docker-compose) — dùng SAVEPOINT để mỗi test tự rollback, không rò rỉ
dữ liệu giữa các test dù code nghiệp vụ có gọi `db.commit()` thật.

Xem `changes/_archive/CHANGE-007-projects-list-create/` — trước đó chỉ
có test dùng DBSession giả (fake/mock), module `projects` là nơi đầu
tiên cần test thật với dữ liệu quan hệ (project + tag + join table).
"""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.db import DBSession, SqlAlchemySessionAdapter, engine, get_db_session
from app.main import app


@pytest.fixture()
def db_session() -> Generator[DBSession, None, None]:
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess: Session, transaction: object) -> None:
        if transaction.nested and not transaction._parent.nested:  # type: ignore[attr-defined]
            sess.begin_nested()

    adapter = SqlAlchemySessionAdapter(session)
    try:
        yield adapter
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: DBSession) -> Generator[TestClient, None, None]:
    def _override() -> Generator[DBSession, None, None]:
        yield db_session

    app.dependency_overrides[get_db_session] = _override
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
