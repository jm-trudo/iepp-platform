from rest_framework.routers import DefaultRouter
from .views import CirconscriptionViewSet

router = DefaultRouter()
router.register(r"", CirconscriptionViewSet, basename="circonscription")

urlpatterns = router.urls