from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.users.models import Role
from .models import Circonscription
from .serializers import CirconscriptionSerializer


def circonscription_de_utilisateur(user):
    """
    Retrouve la Circonscription à laquelle cet utilisateur est rattaché,
    quel que soit son rôle (Chef IEPP directement, ou via son école).
    """
    if user.role == Role.CHEF_IEPP:
        return getattr(user, "circonscription_dirigee", None)

    ecole_dirigee = getattr(user, "ecole_dirigee", None)
    if ecole_dirigee is not None:
        return ecole_dirigee.circonscription

    profil_enseignant = getattr(user, "teacher_profile", None)
    if profil_enseignant and profil_enseignant.ecole_id:
        return profil_enseignant.ecole.circonscription

    profil_conseiller = getattr(user, "conseiller_profile", None)
    if profil_conseiller and profil_conseiller.secteur_id:
        ecole = profil_conseiller.secteur.ecoles.first()
        return ecole.circonscription if ecole else None

    return None


class CirconscriptionViewSet(viewsets.ModelViewSet):
    """
    - Admin : voit et modifie toutes les circonscriptions.
    - Chef IEPP : voit et modifie uniquement la sienne (peut y téléverser son logo).
    """
    queryset = Circonscription.objects.select_related("chef").all()
    serializer_class = CirconscriptionSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch"]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.ADMIN:
            return self.queryset
        if user.role == Role.CHEF_IEPP:
            return self.queryset.filter(chef=user)
        return self.queryset.none()


class MaCirconscriptionView(APIView):
    """
    GET /api/circonscriptions/ma-circonscription/
    Accessible à tout utilisateur authentifié rattaché à une circonscription
    (Chef IEPP, Directeur, Instituteur, Conseiller) — utilisé pour afficher
    le nom et le logo dans le menu de l'application.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        circo = circonscription_de_utilisateur(request.user)
        if not circo:
            return Response({"detail": "Aucune circonscription associée."}, status=404)
        serializer = CirconscriptionSerializer(circo, context={"request": request})
        return Response(serializer.data)