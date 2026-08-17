import importlib

from fastapi.middleware.cors import CORSMiddleware


def _reload_main(monkeypatch, *, running_on_lambda: bool):
    if running_on_lambda:
        monkeypatch.setenv("AWS_LAMBDA_FUNCTION_NAME", "test-function")
    else:
        monkeypatch.delenv("AWS_LAMBDA_FUNCTION_NAME", raising=False)

    import app.main as main_module

    importlib.reload(main_module)
    return main_module.app


def _has_cors_middleware(app) -> bool:
    return any(m.cls is CORSMiddleware for m in app.user_middleware)


def test_cors_middleware_added_when_not_running_on_lambda(monkeypatch):
    app = _reload_main(monkeypatch, running_on_lambda=False)
    assert _has_cors_middleware(app)


def test_cors_middleware_not_added_when_running_on_lambda(monkeypatch):
    app = _reload_main(monkeypatch, running_on_lambda=True)
    assert not _has_cors_middleware(app)
