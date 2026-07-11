import pytest
from apps.teachers.models import TeacherProfile
from apps.students.models import Student
from apps.evaluations.models import Note


@pytest.mark.django_db
class TestSaisieGroupee:
    def test_saisie_groupee_cree_les_notes(
        self, client_authentifie, instituteur_user, classe, ecole
    ):
        TeacherProfile.objects.create(user=instituteur_user, ecole=ecole, classe=classe)
        eleve1 = Student.objects.create(nom="A", prenoms="Un", classe=classe, ecole=ecole)
        eleve2 = Student.objects.create(nom="B", prenoms="Deux", classe=classe, ecole=ecole)

        client = client_authentifie(instituteur_user)
        reponse = client.post("/api/evaluations/saisie-groupee/", {
            "classe": classe.id,
            "matiere": "MATHEMATIQUES",
            "composition": "COMP1",
            "annee_scolaire": "2025-2026",
            "notes": [
                {"eleve": eleve1.id, "valeur": 14},
                {"eleve": eleve2.id, "valeur": 17.5},
            ],
        }, format="json")

        assert reponse.status_code == 201
        assert Note.objects.count() == 2

    def test_saisie_groupee_rejette_eleve_hors_classe(
        self, client_authentifie, instituteur_user, classe, ecole
    ):
        TeacherProfile.objects.create(user=instituteur_user, ecole=ecole, classe=classe)
        from apps.teachers.models import Classe, Niveau
        autre_classe = Classe.objects.create(ecole=ecole, niveau=Niveau.CP1, libelle="B")
        eleve_hors_classe = Student.objects.create(
            nom="Hors", prenoms="Classe", classe=autre_classe, ecole=ecole
        )

        client = client_authentifie(instituteur_user)
        reponse = client.post("/api/evaluations/saisie-groupee/", {
            "classe": classe.id,
            "matiere": "MATHEMATIQUES",
            "composition": "COMP1",
            "annee_scolaire": "2025-2026",
            "notes": [{"eleve": eleve_hors_classe.id, "valeur": 14}],
        }, format="json")

        assert reponse.status_code == 400

    def test_saisie_groupee_upsert_met_a_jour(
        self, client_authentifie, instituteur_user, classe, ecole
    ):
        TeacherProfile.objects.create(user=instituteur_user, ecole=ecole, classe=classe)
        eleve = Student.objects.create(nom="A", prenoms="Un", classe=classe, ecole=ecole)
        client = client_authentifie(instituteur_user)

        donnees = {
            "classe": classe.id, "matiere": "LECTURE", "composition": "COMP1",
            "annee_scolaire": "2025-2026", "notes": [{"eleve": eleve.id, "valeur": 10}],
        }
        client.post("/api/evaluations/saisie-groupee/", donnees, format="json")
        donnees["notes"][0]["valeur"] = 16
        client.post("/api/evaluations/saisie-groupee/", donnees, format="json")

        assert Note.objects.count() == 1  # pas de doublon
        assert Note.objects.first().valeur == 16