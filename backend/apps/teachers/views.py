from rest_framework import viewsets, permissions as drf_permissions
from apps.users.models import User, Role
from .models import Classe, TeacherProfile
from .serializers import ClasseSerializer, TeacherSerializer
from .permissions import ClassePermission, TeacherManagePermission


class ClasseViewSet(viewsets.ModelViewSet):
    serializer_class = ClasseSerializer
    permission_classes = [ClassePermission]
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
    permission_classes = [TeacherManagePermission]
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
            # Un instituteur ne peut pas se réaffecter lui-même
            serializer.validated_data.get("teacher_profile", {}).pop("ecole", None)
            serializer.validated_data.get("teacher_profile", {}).pop("classe", None)
        serializer.save()