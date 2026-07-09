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


def _arrondi(valeur):
    return round(float(valeur), 2) if valeur is not None else None


class DashboardView(APIView):
    """
    Tableau de bord du Chef IEPP : statistiques générales, moyennes,
    classements et commentaires pédagogiques automatiques.
    Réservé à l'Admin système et au Chef de Circonscription.
    Filtre optionnel : ?annee_scolaire=2025-2026
    """
    permission_classes = [IsAdminOrChefIEPP]

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