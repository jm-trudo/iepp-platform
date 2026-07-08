from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r"...", ...ViewSet, basename="...")

urlpatterns = [
    path("", include(router.urls)),
]
