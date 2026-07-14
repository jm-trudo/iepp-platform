from rest_framework import viewsets, permissions as drf_permissions
from apps.users.models import User, Role
from .models import Classe, TeacherProfile
from .serializers import ClasseSerializer, TeacherSerializer
from .permissions import ClassePermission, TeacherManagePermission
from apps.subscriptions.permissions import SubscriptionActivePermission
from django.core.exceptions import ObjectDoesNotExist

class ClasseViewSet(viewsets.ModelViewSet):
    serializer_class = ClasseSerializer
    permission_classes = [ClassePermission, SubscriptionActivePermission]
    filterset_fields = ["ecole", "niveau"]

    def get_queryset(self):
        user = self.request.user
        qs = Classe.objects.select_related("ecole").all()
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return qs
        if user.role == Role.CONSEILLER:
         profile = getattr(user, "conseiller_profile", None)
         secteur = profile.secteur if profile else None
         return qs.filter(ecole__secteur=secteur) if secteur else qs.none()
        if user.role == Role.DIRECTEUR:
            return qs.filter(ecole__directeur=user)
        if user.role == Role.INSTITUTEUR:
            return qs.filter(enseignants__user=user)
        return qs.none()


class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer
    permission_classes = [TeacherManagePermission, SubscriptionActivePermission]
    queryset = User.objects.filter(role=Role.INSTITUTEUR).select_related("teacher_profile")

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return qs
        if user.role == Role.DIRECTEUR:
            return qs.filter(teacher_profile__ecole__directeur=user)
        if user.role == Role.INSTITUTEUR:
            return qs.filter(id=user.id)
        return qs.none()

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == Role.INSTITUTEUR:
         serializer.validated_data.get("teacher_profile", {}).pop("ecole", None)
         serializer.validated_data.get("teacher_profile", {}).pop("classe", None)
        if user.role == Role.DIRECTEUR and "teacher_profile" in serializer.validated_data:
           try:
            ecole_du_directeur = user.ecole_dirigee
           except ObjectDoesNotExist:
            ecole_du_directeur = None
           if ecole_du_directeur:
            serializer.validated_data["teacher_profile"]["ecole"] = ecole_du_directeur
        serializer.save()