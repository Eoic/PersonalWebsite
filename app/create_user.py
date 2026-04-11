"""Create a new user in the database.

Usage:
    uv run python -m app.create_user
"""

import getpass

import bcrypt
from peewee import IntegrityError

from .db import db_proxy, init_db


def create():
    from app.models import User
    from app.forms import RegistrationForm

    init_db()

    username = input("Enter username: ")
    password = getpass.getpass("Enter password: ")
    password_confirm = getpass.getpass("Confirm password: ")

    form = RegistrationForm(
        data={
            "username": username,
            "password": password,
            "password_confirm": password_confirm,
        }
    )

    if not form.validate():
        print("Form validation failed:")

        for field, errors in form.errors.items():
            for error in errors:
                print(f" - {field}: {error}")

        return

    hashed_password = bcrypt.hashpw(
        form.password.data.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    try:
        with db_proxy.atomic():
            user = User.create(
                username=form.username.data,
                password=hashed_password,
            )
    except IntegrityError:
        print(f"User '{form.username.data}' already exists.")
        return

    print(f"User '{user.username}' created with ID {user.id}")


if __name__ == "__main__":
    create()
