import os

from peewee import DatabaseProxy, SqliteDatabase

db_proxy = DatabaseProxy()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DB_PATH = os.path.join(PROJECT_ROOT, "data", "site.db")


def init_db(db_path=None):
    """Initialise the SQLite database and create all tables.

    Args:
        db_path: Optional override for the database file path.
                 Defaults to ``data/site.db`` relative to the project root.
    """
    if db_path is None:
        db_path = DEFAULT_DB_PATH

    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    db = SqliteDatabase(
        db_path,
        pragmas={
            "journal_mode": "wal",
            "foreign_keys": 1,
        },
    )

    db_proxy.initialize(db)

    from .models import ALL_MODELS

    db.connect()
    db.create_tables(ALL_MODELS)
    db.close()

    return db
