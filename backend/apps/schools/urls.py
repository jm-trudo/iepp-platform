from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, SectorViewSet

router = DefaultRouter()
router.register(r"sectors", SectorViewSet, basename="sector")
router.register(r"", SchoolViewSet, basename="school")

urlpatterns = router.urls