from flask import redirect, request, url_for
from flask_admin import Admin
from flask_admin.contrib.peewee import ModelView
from flask_login import current_user

from .models import (
    About,
    Book,
    Education,
    EducationTag,
    Page,
    Position,
    PositionTag,
    Post,
    Project,
    ProjectMedia,
    ProjectTag,
    Tag,
    User,
    WhiteboardStroke,
)


class SecuredModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for("main.login", next=request.url))


class UserModelView(SecuredModelView):
    column_exclude_list = ["password"]
    form_excluded_columns = ["password"]
    can_create = False


class WhiteboardStrokeModelView(SecuredModelView):
    column_exclude_list = ["points_json"]
    form_widget_args = {"points_json": {"readonly": True}}


def init_admin(app):
    admin = Admin(
        app,
        name="Site Admin",
        url="/admin",
        endpoint="admin",
    )

    admin.add_view(SecuredModelView(Page, name="Pages"))
    admin.add_view(SecuredModelView(Position, name="Positions"))
    admin.add_view(SecuredModelView(Education, name="Education"))
    admin.add_view(SecuredModelView(Project, name="Projects"))
    admin.add_view(SecuredModelView(ProjectMedia, name="Project Media"))
    admin.add_view(SecuredModelView(Tag, name="Tags"))
    admin.add_view(SecuredModelView(PositionTag, name="Position Tags"))
    admin.add_view(SecuredModelView(EducationTag, name="Education Tags"))
    admin.add_view(SecuredModelView(ProjectTag, name="Project Tags"))
    admin.add_view(SecuredModelView(About, name="About"))
    admin.add_view(SecuredModelView(Post, name="Posts"))
    admin.add_view(SecuredModelView(Book, name="Books"))
    admin.add_view(UserModelView(User, name="Users"))
    admin.add_view(
        WhiteboardStrokeModelView(WhiteboardStroke, name="Whiteboard Strokes")
    )

    return admin
