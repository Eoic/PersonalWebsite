from datetime import UTC, datetime

from flask_login import UserMixin
from peewee import (
    AutoField,
    CharField,
    DateField,
    DateTimeField,
    ForeignKeyField,
    IntegerField,
    Model,
    TextField,
)

from .db import db_proxy


class BaseModel(Model):
    class Meta:
        database = db_proxy


class User(UserMixin, BaseModel):
    id = AutoField()
    username = CharField(unique=True)
    password = CharField()


class Page(BaseModel):
    id = AutoField()
    slug = CharField(unique=True)
    title = CharField()
    description = TextField()
    url = CharField()
    sort_order = IntegerField()
    hidden = IntegerField(default=0)


class Position(BaseModel):
    id = AutoField()
    title = CharField()
    company = CharField()
    date_from = DateField()
    date_until = DateField(null=True)
    description = TextField()
    sort_order = IntegerField()


class Education(BaseModel):
    id = AutoField()
    title = CharField()
    institution = CharField()
    date_from = DateField()
    date_until = DateField(null=True)
    description = TextField(null=True)
    sort_order = IntegerField()


class Project(BaseModel):
    id = AutoField()
    title = CharField()
    subtitle = CharField()
    title_link = CharField(null=True)
    description = TextField()
    sort_order = IntegerField()


class ProjectMedia(BaseModel):
    id = AutoField()
    project = ForeignKeyField(Project, backref="media", on_delete="CASCADE")
    media_type = CharField()
    src = CharField()
    alt = CharField()


class Tag(BaseModel):
    id = AutoField()
    name = CharField(unique=True)


class PositionTag(BaseModel):
    position = ForeignKeyField(Position, backref="position_tags", on_delete="CASCADE")
    tag = ForeignKeyField(Tag, backref="position_tags", on_delete="CASCADE")

    class Meta:
        indexes = ((("position", "tag"), True),)


class EducationTag(BaseModel):
    education = ForeignKeyField(
        Education,
        backref="education_tags",
        on_delete="CASCADE",
    )

    tag = ForeignKeyField(Tag, backref="education_tags", on_delete="CASCADE")

    class Meta:
        indexes = ((("education", "tag"), True),)


class ProjectTag(BaseModel):
    project = ForeignKeyField(Project, backref="project_tags", on_delete="CASCADE")
    tag = ForeignKeyField(Tag, backref="project_tags", on_delete="CASCADE")

    class Meta:
        indexes = ((("project", "tag"), True),)


class About(BaseModel):
    id = AutoField()
    key = CharField(unique=True)
    value = TextField()


class Post(BaseModel):
    id = AutoField()
    title = CharField()
    published_on = DateField()
    body = TextField()
    sort_order = IntegerField()


class Book(BaseModel):
    id = AutoField()
    title = CharField()
    author = CharField()
    cover = CharField()


class WhiteboardStroke(BaseModel):
    id = AutoField()
    board_slug = CharField(index=True)
    client_session_id = CharField(index=True)
    tool = CharField()
    color = CharField()
    brush_size = IntegerField()
    points_json = TextField()
    created_at = DateTimeField(default=lambda: datetime.now(UTC))


ALL_MODELS = [
    Page,
    Position,
    Education,
    Project,
    ProjectMedia,
    Tag,
    PositionTag,
    EducationTag,
    ProjectTag,
    About,
    Post,
    Book,
    WhiteboardStroke,
    User,
]
