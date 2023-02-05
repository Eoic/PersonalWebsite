from django.db import models
from django.contrib.auth.models import AbstractUser


class Entry(models.Model):
    POSITION = 'POS'
    PROJECT = 'PRJ'
    EDUCATION = 'EDU'

    ENTRY_CATEGORIES = [
        (POSITION, 'Position'),
        (PROJECT, 'Project'),
        (EDUCATION, 'Education'),
    ]

    class Meta:
        verbose_name = 'Entry'
        verbose_name_plural = 'Entries'

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=3, choices=ENTRY_CATEGORIES)
    started_at = models.DateField()
    ended_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Technology(models.Model):
    title = models.CharField(max_length=200)

    class Meta:
        verbose_name = 'Technology'
        verbose_name_plural = 'Technologies'
        constraints = [
            models.UniqueConstraint(
                fields=['title'],
                name='unique_technology'
            )
        ]

    def __str__(self):
        return self.title


class EntryTechnology(models.Model):
    entry = models.ForeignKey(Entry, on_delete=models.CASCADE, related_name='entry_technologies')
    technology = models.ForeignKey(Technology, on_delete=models.CASCADE, related_name='entry_technologies')

    class Meta:
        verbose_name = 'Entry technology'
        verbose_name_plural = 'Entry technologies'
        constraints = [
            models.UniqueConstraint(
                fields=['entry', 'technology'],
                name='unique_entry_technology'
            )
        ]

    def __str__(self):
        return f'{self.entry} - {self.technology}'


class ExtendedUser(AbstractUser):
    bio = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=200, null=True, blank=True)
    company = models.CharField(max_length=200, null=True, blank=True)
    position = models.CharField(max_length=200, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars', null=True, blank=True)


class ExtendedUserSocialLinks(models.Model):
    url = models.URLField()
    title = models.CharField(max_length=200)
    icon = models.CharField(max_length=200)
    user = models.ForeignKey(ExtendedUser, on_delete=models.CASCADE, related_name='social_links')

    class Meta:
        verbose_name = 'Social link'
        verbose_name_plural = 'Social links'

    def __str__(self):
        return f'{self.title} - {self.url}'