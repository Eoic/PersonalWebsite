from django.contrib import admin
from .models import Technology, Entry, EntryTechnology, ExtendedUser, ExtendedUserSocialLinks


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ('title', 'description', 'category', 'started_at', 'ended_at')


@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = ('title',)


@admin.register(EntryTechnology)
class EntryTechnologyAdmin(admin.ModelAdmin):
    list_display = ('entry', 'technology')


@admin.register(ExtendedUser)
class ExtendedUserAdmin(admin.ModelAdmin):
    pass


@admin.register(ExtendedUserSocialLinks)
class ExtendedUserSocialLinksAdmin(admin.ModelAdmin):
    list_display = ('title', 'url', 'icon')