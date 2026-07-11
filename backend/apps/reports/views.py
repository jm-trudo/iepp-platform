from django.db.models import Avg, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.users.permissions import IsAdminOrChefIEPP
from apps.users.models import User, Role
from apps.schools.models import School
from apps.teachers.models import Classe
from apps.students.models import Student
from apps.evaluations.models import Note, Matiere
from apps.authorizations.models import AuthorizationRequest, StatutDemande
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from apps.users.models import Role
from apps.schools.models import School
from apps.teachers.models import Classe
from apps.students.models import Student
from . import generators
from apps.subscriptions.permissions import SubscriptionActivePermission

def _arrondi(valeur):
    return round(float(valeur), 2) if valeur is not None else None


class DashboardView(APIView):
    """
    Tableau de bord du Chef IEPP : statistiques générales, moyennes,
    classements et commentaires pédagogiques automatiques.
    Réservé à l'Admin système et au Chef de Circonscription.
    Filtre optionnel : ?annee_scolaire=2025-2026
    """
    permission_classes = [IsAdminOrChefIEPP, SubscriptionActivePermission]

    def get(self, request):
        annee = request.query_params.get("annee_scolaire")
        notes_qs = Note.objects.all()
        if annee:
            notes_qs = notes_qs.filter(annee_scolaire=annee)

        moyennes_classes = self._moyennes_par_classe(notes_qs)
        moyennes_ecoles = self._moyennes_par_ecole(notes_qs)

        data = {
            "statistiques_generales": self._statistiques_generales(),
            "moyennes_par_matiere": self._moyennes_par_matiere(notes_qs),
            "classement_eleves": self._classement_eleves(notes_qs),
            "classement_classes": moyennes_classes,
            "classement_ecoles": moyennes_ecoles,
            "analyse_pedagogique": self._analyse_pedagogique(notes_qs),
        }
        return Response(data)

    def _statistiques_generales(self):
        return {
            "nombre_ecoles": School.objects.count(),
            "nombre_enseignants": User.objects.filter(role=Role.INSTITUTEUR).count(),
            "nombre_eleves": Student.objects.count(),
            "nombre_classes": Classe.objects.count(),
            "nombre_directeurs": User.objects.filter(role=Role.DIRECTEUR).count(),
            "nombre_demandes_en_attente": AuthorizationRequest.objects.filter(
                statut=StatutDemande.EN_ATTENTE
            ).count(),
        }

    def _moyennes_par_matiere(self, notes_qs):
        resultats = (
            notes_qs.values("matiere")
            .annotate(moyenne=Avg("valeur"), nombre_notes=Count("id"))
            .order_by("-moyenne")
        )
        labels = dict(Matiere.choices)
        return [
            {
                "matiere": r["matiere"],
                "matiere_display": labels.get(r["matiere"], r["matiere"]),
                "moyenne": _arrondi(r["moyenne"]),
                "nombre_notes": r["nombre_notes"],
            }
            for r in resultats
        ]

    def _moyennes_par_classe(self, notes_qs):
        resultats = (
            notes_qs.values("classe", "classe__niveau", "classe__libelle", "classe__ecole__nom")
            .annotate(moyenne=Avg("valeur"), nombre_notes=Count("id"))
            .order_by("-moyenne")
        )
        return [
            {
                "classe_id": r["classe"],
                "niveau": r["classe__niveau"],
                "libelle": r["classe__libelle"],
                "ecole": r["classe__ecole__nom"],
                "moyenne": _arrondi(r["moyenne"]),
                "nombre_notes": r["nombre_notes"],
            }
            for r in resultats
        ]

    def _moyennes_par_ecole(self, notes_qs):
        resultats = (
            notes_qs.values("classe__ecole", "classe__ecole__nom")
            .annotate(moyenne=Avg("valeur"), nombre_notes=Count("id"))
            .order_by("-moyenne")
        )
        return [
            {
                "ecole_id": r["classe__ecole"],
                "ecole_nom": r["classe__ecole__nom"],
                "moyenne": _arrondi(r["moyenne"]),
                "nombre_notes": r["nombre_notes"],
            }
            for r in resultats
        ]

    def _classement_eleves(self, notes_qs, limite=20):
        resultats = (
            notes_qs.values("eleve", "eleve__nom", "eleve__prenoms", "eleve__classe__ecole__nom")
            .annotate(moyenne=Avg("valeur"), nombre_notes=Count("id"))
            .order_by("-moyenne")[:limite]
        )
        return [
            {
                "eleve_id": r["eleve"],
                "nom": r["eleve__nom"],
                "prenoms": r["eleve__prenoms"],
                "ecole": r["eleve__classe__ecole__nom"],
                "moyenne": _arrondi(r["moyenne"]),
                "nombre_notes": r["nombre_notes"],
            }
            for r in resultats
        ]

    def _analyse_pedagogique(self, notes_qs):
        matieres = self._moyennes_par_matiere(notes_qs)
        if not matieres:
            return {
                "points_forts": [],
                "matieres_faibles": [],
                "commentaires": ["Aucune note enregistrée pour le moment."],
            }

        points_forts = matieres[:3]
        matieres_faibles = matieres[-3:][::-1]

        commentaires = []
        for m in matieres_faibles:
            if m["moyenne"] is not None and m["moyenne"] < 10:
                commentaires.append(
                    f"{m['matiere_display']} : moyenne de {m['moyenne']}/20, matière à renforcer en priorité."
                )
        for m in points_forts:
            if m["moyenne"] is not None and m["moyenne"] >= 14:
                commentaires.append(
                    f"{m['matiere_display']} : bon niveau général, moyenne de {m['moyenne']}/20."
                )
        if not commentaires:
            commentaires.append("Résultats globalement homogènes entre les matières.")

        return {
            "points_forts": points_forts,
            "matieres_faibles": matieres_faibles,
            "commentaires": commentaires,
        }
    


def _pdf_response(buffer, nom_fichier):
    return FileResponse(buffer, as_attachment=True, filename=nom_fichier)


class EcolesPdfView(APIView):
    """GET /api/reports/ecoles/pdf/ — réservé Admin/Chef IEPP."""
    permission_classes = [IsAdminOrChefIEPP, SubscriptionActivePermission]

    def get(self, request):
        buffer = generators.liste_ecoles_pdf(School.objects.select_related("directeur", "secteur"))
        return _pdf_response(buffer, "liste_ecoles.pdf")


class EnseignantsPdfView(APIView):
    """GET /api/reports/enseignants/pdf/?ecole=<id> — Admin/Chef IEPP (tout), Directeur (son école)."""
    permission_classes = [IsAuthenticated, SubscriptionActivePermission]

    def get(self, request):
        user = request.user
        qs = User.objects.filter(role=Role.INSTITUTEUR).select_related("teacher_profile")
        ecole_id = request.query_params.get("ecole")

        if user.role == Role.DIRECTEUR:
            qs = qs.filter(teacher_profile__ecole__directeur=user)
        elif user.role not in (Role.ADMIN, Role.CHEF_IEPP):
            return Response({"detail": "Non autorisé."}, status=403)
        elif ecole_id:
            qs = qs.filter(teacher_profile__ecole_id=ecole_id)

        buffer = generators.liste_enseignants_pdf(qs)
        return _pdf_response(buffer, "liste_enseignants.pdf")


class ElevesPdfView(APIView):
    """GET /api/reports/eleves/pdf/?classe=<id> — Admin/Chef IEPP/Directeur/Instituteur, selon leur périmètre."""
    permission_classes = [IsAuthenticated, SubscriptionActivePermission]

    def get(self, request):
        user = request.user
        classe_id = request.query_params.get("classe")
        qs = Student.objects.select_related("classe", "ecole")
        titre_complement = ""

        if classe_id:
            classe = get_object_or_404(Classe, pk=classe_id)
            autorise = (
                user.role in (Role.ADMIN, Role.CHEF_IEPP)
                or (user.role == Role.DIRECTEUR and classe.ecole.directeur_id == user.id)
                or (user.role == Role.INSTITUTEUR and classe.enseignants.filter(user=user).exists())
            )
            if not autorise:
                return Response({"detail": "Non autorisé."}, status=403)
            qs = qs.filter(classe=classe)
            titre_complement = str(classe)
        else:
            if user.role in (Role.ADMIN, Role.CHEF_IEPP):
                pass
            elif user.role == Role.DIRECTEUR:
                qs = qs.filter(ecole__directeur=user)
            elif user.role == Role.INSTITUTEUR:
                qs = qs.filter(classe__enseignants__user=user)
            else:
                return Response({"detail": "Non autorisé."}, status=403)

        buffer = generators.liste_eleves_pdf(qs, titre_complement)
        return _pdf_response(buffer, "liste_eleves.pdf")


class BulletinPdfView(APIView):
    """GET /api/reports/bulletin/<eleve_id>/pdf/?annee_scolaire=2025-2026"""
    permission_classes = [IsAuthenticated, SubscriptionActivePermission]

    def get(self, request, eleve_id):
        eleve = get_object_or_404(Student, pk=eleve_id)
        user = request.user
        autorise = (
            user.role in (Role.ADMIN, Role.CHEF_IEPP)
            or (user.role == Role.DIRECTEUR and eleve.ecole.directeur_id == user.id)
            or (user.role == Role.INSTITUTEUR and eleve.classe.enseignants.filter(user=user).exists())
        )
        if not autorise:
            return Response({"detail": "Non autorisé."}, status=403)

        annee = request.query_params.get("annee_scolaire")
        if not annee:
            return Response({"detail": "Le paramètre annee_scolaire est requis."}, status=400)

        buffer = generators.bulletin_eleve_pdf(eleve, annee)
        return _pdf_response(buffer, f"bulletin_{eleve.nom}_{eleve.prenoms}.pdf")


class StatistiquesPdfView(APIView):
    """GET /api/reports/statistiques/pdf/?annee_scolaire=2025-2026 — réservé Admin/Chef IEPP."""
    permission_classes = [IsAdminOrChefIEPP, SubscriptionActivePermission]

    def get(self, request):
        annee = request.query_params.get("annee_scolaire")
        donnees = DashboardView().get(request).data  # réutilise le calcul déjà écrit à la Section 10
        buffer = generators.statistiques_pdf(donnees, annee)
        return _pdf_response(buffer, "statistiques_circonscription.pdf")  