from unittest.mock import MagicMock

from app.core import s3


def test_generate_presigned_put_url_calls_client_with_expected_params(monkeypatch):
    fake_client = MagicMock()
    fake_client.generate_presigned_url.return_value = "https://example.com/put-url"
    monkeypatch.setattr(s3, "_get_client", lambda: fake_client)
    monkeypatch.setattr(s3.settings, "attachments_bucket_name", "my-bucket")

    url = s3.generate_presigned_put_url("projects/1/abc.jpg", "image/jpeg")

    assert url == "https://example.com/put-url"
    fake_client.generate_presigned_url.assert_called_once_with(
        "put_object",
        Params={
            "Bucket": "my-bucket",
            "Key": "projects/1/abc.jpg",
            "ContentType": "image/jpeg",
        },
        ExpiresIn=s3.PRESIGNED_PUT_EXPIRES_SECONDS,
    )


def test_generate_presigned_get_url_calls_client_with_expected_params(monkeypatch):
    fake_client = MagicMock()
    fake_client.generate_presigned_url.return_value = "https://example.com/get-url"
    monkeypatch.setattr(s3, "_get_client", lambda: fake_client)
    monkeypatch.setattr(s3.settings, "attachments_bucket_name", "my-bucket")

    url = s3.generate_presigned_get_url("projects/1/abc.jpg")

    assert url == "https://example.com/get-url"
    fake_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "my-bucket", "Key": "projects/1/abc.jpg"},
        ExpiresIn=s3.PRESIGNED_GET_EXPIRES_SECONDS,
    )


def test_delete_object_calls_client_delete(monkeypatch):
    fake_client = MagicMock()
    monkeypatch.setattr(s3, "_get_client", lambda: fake_client)
    monkeypatch.setattr(s3.settings, "attachments_bucket_name", "my-bucket")

    s3.delete_object("projects/1/abc.jpg")

    fake_client.delete_object.assert_called_once_with(
        Bucket="my-bucket", Key="projects/1/abc.jpg"
    )
