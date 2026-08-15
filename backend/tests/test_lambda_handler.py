from app.lambda_handler import handler


def test_handler_is_callable():
    assert callable(handler)
