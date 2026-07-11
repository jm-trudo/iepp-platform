import pytest
from apps.authorizations.models import AuthorizationRequest, StatutDemande


@pytest.mark.django_db
class TestWorkflowAutorisation:
    def test_workflow_complet_acceptation(
        self, client_authentifie, instituteur_user, chef_iepp_user, ecole
    ):
        client_agent = client_authentifie(instituteur_user)
        reponse_creation = client_agent.post("/api/authorizations/", {
            "ecole": ecole.id, "motif": "Formation",
            "date_depart": "2026-08-01", "date_retour": "2026-08-03",
        })
        assert reponse_creation.status_code == 201
        assert reponse_creation.data["statut"] == "EN_ATTENTE"
        assert reponse_creation.data["nombre_jours"] == 3

        demande_id = reponse_creation.data["id"]
        client_chef = client_authentifie(chef_iepp_user)
        reponse_decision = client_chef.post(
            f"/api/authorizations/{demande_id}/accepter/", {"commentaire": "OK"}
        )
        assert reponse_decision.status_code == 200
        assert reponse_decision.data["statut"] == "ACCEPTEE"

    def test_impossible_de_trancher_deux_fois(
        self, client_authentifie, instituteur_user, chef_iepp_user, ecole
    ):
        demande = AuthorizationRequest.objects.create(
            agent=instituteur_user, ecole=ecole, motif="Test",
            date_depart="2026-08-01", date_retour="2026-08-02",
            statut=StatutDemande.ACCEPTEE,
        )
        client = client_authentifie(chef_iepp_user)
        reponse = client.post(f"/api/authorizations/{demande.id}/refuser/", {})
        assert reponse.status_code == 400

    def test_instituteur_ne_voit_pas_les_demandes_dautrui(
        self, client_authentifie, instituteur_user, autre_instituteur_user, ecole
    ):
        AuthorizationRequest.objects.create(
            agent=autre_instituteur_user, ecole=ecole, motif="Confidentiel",
            date_depart="2026-08-01", date_retour="2026-08-02",
        )
        client = client_authentifie(instituteur_user)
        reponse = client.get("/api/authorizations/")
        assert reponse.data["count"] == 0