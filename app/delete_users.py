"""Delete all users from the database.

Usage:
    uv run python -m app.delete_users
"""

from .db import db_proxy, init_db


def delete_all():
    from app.models import User

    init_db()

    count = User.select().count()

    if count == 0:
        print("No users to delete.")
        return

    confirm = input(f"Delete all {count} user(s)? [y/N] ")

    if confirm.lower() != "y":
        print("Aborted.")
        return

    with db_proxy.atomic():
        deleted = User.delete().execute()

    print(f"Deleted {deleted} user(s).")


if __name__ == "__main__":
    delete_all()
