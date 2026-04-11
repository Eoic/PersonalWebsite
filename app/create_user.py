"""Create a new user in the database.

Usage:
    uv run python -m app.create_user
"""

import bcrypt
from .db import db_proxy, init_db


def create():
    from app.models import User
    from app.forms import RegistrationForm

    username = input("Enter username: ")
    password = input("Enter password: ")
    password_confirm = input("Confirm password: ")

    form = RegistrationForm(
        data={
            "username": username,
            "password": password,
            "password_confirm": password_confirm,
        }
    )

    if form.validate():
        _db = init_db()

        with db_proxy.atomic():
            existing_user = (
                User.select().where(User.username == form.username.data).first()
            )

            if existing_user:
                print(f"User '{form.username.data}' already exists.")
                return

            hashed_password = bcrypt.hashpw(
                form.password.data.encode("utf-8"), bcrypt.gensalt()
            )

            user = User(username=form.username.data, password=hashed_password)
            user.save()
            print(f"User '{user.username}' created with ID {user.id}")
    else:
        print("Form validation failed:")

        for field, errors in form.errors.items():
            for error in errors:
                print(f" - {field}: {error}")


if __name__ == "__main__":
    create()
