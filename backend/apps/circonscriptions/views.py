from rest_framework import viewsets
from apps.users.permissions import IsAdmin
from .models import Circonscription
from .serializers import CirconscriptionSerializer


class CirconscriptionViewSet(viewsets.ModelViewSet):
    """Réservé à l'Admin système : vue d'ensemble de toutes les circonscriptions clientes."""
    queryset = Circonscription.objects.select_related("chef").all()
    serializer_class = CirconscriptionSerializer
    permission_classes = [IsAdmin]
    http_method_names = ["get", "patch"]  # création automatique uniquement, pas manuelle