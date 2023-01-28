from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from personal.urls import urlpatterns as personal_urls

urlpatterns = [
    path('', include(personal_urls)),
    path('admin/', admin.site.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)