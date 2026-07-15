from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CirconscriptionViewSet, MaCirconscriptionView

router = DefaultRouter()
router.register(r"", CirconscriptionViewSet, basename="circonscription")

urlpatterns = [
    path("ma-circonscription/", MaCirconscriptionView.as_view(), name="ma-circonscription"),
] + router.urls