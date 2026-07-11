from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from apps.users.models import Role
from .models import Student
from .serializers import StudentSerializer
from .permissions import StudentPermission
from apps.subscriptions.permissions import SubscriptionActivePermission

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [StudentPermission, SubscriptionActivePermission]
    filterset_fields = ["classe", "ecole", "sexe"]
    search_fields = ["nom", "prenoms"]

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.select_related("classe", "ecole").all()

        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return qs
        if user.role == Role.CONSEILLER:
            return qs  # affiné à la Section 7 (restriction par secteur)
        if user.role == Role.DIRECTEUR:
            return qs.filter(ecole__directeur=user)
        if user.role == Role.INSTITUTEUR:
            return qs.filter(classe__enseignants__user=user)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        classe = serializer.validated_data.get("classe")
        if user.role == Role.INSTITUTEUR and not classe.enseignants.filter(user=user).exists():
            raise PermissionDenied("Vous ne pouvez ajouter des élèves que dans une classe qui vous est affectée.")
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        classe = serializer.validated_data.get("classe", serializer.instance.classe)
        if user.role == Role.INSTITUTEUR and not classe.enseignants.filter(user=user).exists():
            raise PermissionDenied("Vous ne pouvez modifier que les élèves de votre classe.")
        serializer.save()
