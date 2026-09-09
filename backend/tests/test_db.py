from sqlalchemy import text
from app.db.session import engine


def test_real_postgres_connection():
    """Verify that SQLAlchemy establishes a live connection to PostgreSQL."""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1;")).scalar()
        assert result == 1

        version = conn.execute(text("SELECT version();")).scalar()
        assert "PostgreSQL" in version
