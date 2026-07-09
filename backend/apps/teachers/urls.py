from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClasseViewSet, TeacherViewSet

router = DefaultRouter()
router.register(r"classes", ClasseViewSet, basename="classe")
router.register(r"", TeacherViewSet, basename="teacher")

urlpatterns = router.urls