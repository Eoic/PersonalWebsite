from wtforms import Form, StringField, validators, PasswordField
from wtforms.csrf.session import SessionCSRF
from flask import current_app
from wtforms.widgets import TextArea


class LoginForm(Form):
    username = StringField(
        "Username",
        [validators.DataRequired()],
        render_kw={"autocomplete": "username"},
    )

    password = PasswordField(
        "Password",
        [validators.DataRequired()],
        render_kw={"autocomplete": "current-password"},
    )

    class Meta:
        csrf = True
        csrf_class = SessionCSRF

        @property
        def csrf_secret(self):
            return current_app.config["SECRET_KEY"].encode("utf-8")


class RegistrationForm(Form):
    username = StringField(
        "Username",
        [
            validators.Length(min=4, max=25),
            validators.DataRequired(),
        ],
        name="username",
        render_kw={"autocomplete": "username"},
    )

    password = PasswordField(
        "Password",
        [
            validators.Length(min=12, max=255),
            validators.DataRequired(),
        ],
        name="password",
        render_kw={"autocomplete": "new-password"},
    )

    password_confirm = PasswordField(
        "Confirm Password",
        [
            validators.EqualTo("password", message="Passwords must match"),
            validators.DataRequired(),
        ],
        name="password_confirm",
        render_kw={"autocomplete": "new-password"},
    )


class PostForm(Form):
    title = StringField(
        "Title",
        [validators.Length(min=1, max=255), validators.DataRequired()],
        name="title",
    )

    body = StringField(
        "Body",
        [validators.Length(min=1), validators.DataRequired()],
        widget=TextArea(),
        name="body",
    )

    class Meta:
        csrf = True
        csrf_class = SessionCSRF

        @property
        def csrf_secret(self):
            return current_app.config["SECRET_KEY"].encode("utf-8")
