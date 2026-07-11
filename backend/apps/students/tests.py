import pytest
from datetime import date
from apps.teachers.models import TeacherProfile
from apps.students.models import Student


@pytest.mark.django_db
class TestStudentPermissions:
    def _affecter_instituteur_a_classe(self, instituteur, classe, ecole):
        TeacherProfile.objects.create(user=instituteur, ecole=ecole, classe=classe)

    def test_instituteur_peut_ajouter_eleve_dans_sa_classe(
        self, client_authentifie, instituteur_user, classe, ecole
    ):
        self._affecter_instituteur_a_classe(instituteur_user, classe, ecole)
        client = client_authentifie(instituteur_user)
        reponse = client.post("/api/students/", {
            "nom": "Kouassi", "prenoms": "Aya",
            "date_naissance": "2015-04-10", "sexe": "F",
            "classe": classe.id,
        })
        assert reponse.status_code == 201
        assert reponse.data["ecole"] == ecole.id  # école déduite automatiquement

    def test_instituteur_ne_peut_pas_ajouter_eleve_hors_de_sa_classe(
        self, client_authentifie, autre_instituteur_user, classe
    ):
        # autre_instituteur_user n'est affecté à AUCUNE classe
        client = client_authentifie(autre_instituteur_user)
        reponse = client.post("/api/students/", {
            "nom": "Test", "prenoms": "Élève", "classe": classe.id,
        })
        assert reponse.status_code == 403

    def test_directeur_lecture_seule(
        self, client_authentifie, directeur_user, classe, ecole
    ):
        Student.objects.create(nom="Existant", prenoms="Élève", classe=classe, ecole=ecole)
        client = client_authentifie(directeur_user)

        reponse_lecture = client.get("/api/students/")
        assert reponse_lecture.status_code == 200
        assert reponse_lecture.data["count"] == 1

        reponse_creation = client.post("/api/students/", {
            "nom": "Nouveau", "prenoms": "Élève", "classe": classe.id,
        })
        assert reponse_creation.status_code == 403