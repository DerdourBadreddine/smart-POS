import json

import pytest
from django.test import override_settings


@pytest.fixture
def frontend_dir(tmp_path):
    (tmp_path / "assets" / "i18n").mkdir(parents=True)
    (tmp_path / "assets" / "i18n" / "fr.json").write_text(
        json.dumps({"common": {"save": "Enregistrer"}}),
        encoding="utf-8",
    )
    (tmp_path / "assets" / "material-icons.woff2").write_bytes(b"font-data")
    (tmp_path / "index.html").write_text("<app-root></app-root>", encoding="utf-8")
    return tmp_path


@pytest.mark.django_db
def test_frontend_translation_is_served_as_json(frontend_dir, client):
    with override_settings(FRONTEND_DIR=frontend_dir):
        response = client.get("/assets/i18n/fr.json")

    assert response.status_code == 200
    assert response["Content-Type"] == "application/json"
    body = b"".join(response.streaming_content)
    assert json.loads(body)["common"]["save"] == "Enregistrer"


@pytest.mark.django_db
def test_frontend_font_is_served_with_font_mime_type(frontend_dir, client):
    with override_settings(FRONTEND_DIR=frontend_dir):
        response = client.get("/assets/material-icons.woff2")

    assert response.status_code == 200
    assert response["Content-Type"] == "font/woff2"
    assert b"".join(response.streaming_content) == b"font-data"
