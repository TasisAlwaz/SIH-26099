from app.core.config import settings


def test_settings_loaded():
    assert settings.PROJECT_NAME is not None
    assert settings.API_V1_STR == "/api/v1"
    # Mandatory Constitutional Invariant
    assert settings.AI_MODE.lower() == "mock"
    assert settings.POSTGRES_DB == "nmat_db"
    assert "postgresql" in settings.sync_database_url
