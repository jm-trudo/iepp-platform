from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CustomTokenObtainPairView, MeView, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
] + router.urls