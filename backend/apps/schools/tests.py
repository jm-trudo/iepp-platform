import pytest
from django.urls import reverse
from apps.subscriptions.permissions import SubscriptionActivePermission

@pytest.mark.django_db
class TestSchoolPermissions:
    def test_admin_voit_toutes_les_ecoles(self, client_authentifie, admin_user, ecole):
        client = client_authentifie(admin_user)
        reponse = client.get("/api/schools/")
        assert reponse.status_code == 200
        assert reponse.data["count"] == 1

    def test_directeur_ne_voit_que_son_ecole(self, client_authentifie, directeur_user, ecole):
        client = client_authentifie(directeur_user)
        reponse = client.get("/api/schools/")
        assert reponse.status_code == 200
        assert reponse.data["count"] == 1
        assert reponse.data["results"][0]["id"] == ecole.id

    def test_instituteur_ne_peut_pas_creer_ecole(self, client_authentifie, instituteur_user):
        client = client_authentifie(instituteur_user)
        reponse = client.post("/api/schools/", {
            "nom": "Nouvelle École", "code": "NEW-001",
        })
        assert reponse.status_code == 403

    def test_directeur_ne_peut_pas_modifier_ecole_autrui(
        self, client_authentifie, ecole, secteur
    ):
        """
        Un Directeur qui n'est affecté à aucune école ne voit même pas
        l'existence de l'école d'un autre (get_queryset filtre en amont) :
        DRF renvoie 404, pas 403 — c'est le comportement voulu, il évite
        de révéler l'existence de ressources hors du périmètre de l'utilisateur.
        """
        from apps.users.models import User, Role
        autre_directeur = User.objects.create_user(
            username="autre_directeur", password="test123", role=Role.DIRECTEUR
        )
        client = client_authentifie(autre_directeur)
        reponse = client.patch(f"/api/schools/{ecole.id}/", {"nom": "Piraté"})
        assert reponse.status_code == 404

    def test_utilisateur_non_authentifie_refuse(self, api_client, ecole):
        reponse = api_client.get("/api/schools/")
        assert reponse.status_code == 401