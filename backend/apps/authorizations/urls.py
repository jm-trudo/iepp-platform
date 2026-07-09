from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthorizationRequestViewSet

router = DefaultRouter()
router.register(r"", AuthorizationRequestViewSet, basename="authorization")

urlpatterns = router.urls
