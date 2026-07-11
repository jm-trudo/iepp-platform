import pytest
from datetime import date, timedelta
from apps.subscriptions.models import Subscription


@pytest.mark.django_db
class TestBlocageAbonnement:
    def test_chef_bloque_si_abonnement_expire(
        self, client_authentifie, chef_iepp_user
    ):
        Subscription.objects.create(
            chef=chef_iepp_user,
            date_debut=date.today() - timedelta(days=400),
            date_fin=date.today() - timedelta(days=30),
        )
        client = client_authentifie(chef_iepp_user)
        reponse = client.get("/api/schools/")
        assert reponse.status_code == 403

    def test_chef_autorise_si_abonnement_actif(
        self, client_authentifie, chef_iepp_user
    ):
        Subscription.objects.create(
            chef=chef_iepp_user,
            date_debut=date.today() - timedelta(days=30),
            date_fin=date.today() + timedelta(days=300),
        )
        client = client_authentifie(chef_iepp_user)
        reponse = client.get("/api/schools/")
        assert reponse.status_code == 200

    def test_admin_jamais_bloque_meme_si_abonnement_expire(
        self, client_authentifie, admin_user, chef_iepp_user
    ):
        Subscription.objects.create(
            chef=chef_iepp_user,
            date_debut=date.today() - timedelta(days=400),
            date_fin=date.today() - timedelta(days=30),
        )
        client = client_authentifie(admin_user)
        reponse = client.get("/api/schools/")
        assert reponse.status_code == 200

    def test_mon_statut_accessible_meme_expire(
        self, client_authentifie, chef_iepp_user
    ):
        Subscription.objects.create(
            chef=chef_iepp_user,
            date_debut=date.today() - timedelta(days=400),
            date_fin=date.today() - timedelta(days=30),
        )
        client = client_authentifie(chef_iepp_user)
        reponse = client.get("/api/subscriptions/mon-statut/")
        assert reponse.status_code == 200