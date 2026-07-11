import pytest
from rest_framework.test import APIClient
from apps.users.models import User, Role
from apps.schools.models import School, Sector
from apps.teachers.models import Classe, Niveau


@pytest.fixture
def api_client():
    return APIClient()


def _creer_utilisateur(role, username, **kwargs):
    return User.objects.create_user(
        username=username, password="motdepasse123", role=role, **kwargs
    )


@pytest.fixture
def admin_user(db):
    return _creer_utilisateur(Role.ADMIN, "admin_test")


@pytest.fixture
def chef_iepp_user(db):
    return _creer_utilisateur(Role.CHEF_IEPP, "chef_test")


@pytest.fixture
def directeur_user(db):
    return _creer_utilisateur(Role.DIRECTEUR, "directeur_test")


@pytest.fixture
def instituteur_user(db):
    return _creer_utilisateur(Role.INSTITUTEUR, "instituteur_test")


@pytest.fixture
def autre_instituteur_user(db):
    return _creer_utilisateur(Role.INSTITUTEUR, "autre_instituteur_test")


@pytest.fixture
def secteur(db):
    return Sector.objects.create(nom="Secteur Test")


@pytest.fixture
def ecole(db, directeur_user, secteur):
    return School.objects.create(
        nom="École Test", code="ECOLE-TEST-001",
        directeur=directeur_user, secteur=secteur,
    )


@pytest.fixture
def classe(db, ecole):
    return Classe.objects.create(ecole=ecole, niveau=Niveau.CM2, libelle="A")


@pytest.fixture
def client_authentifie(api_client):
    """Retourne une fonction qui authentifie le client avec l'utilisateur donné."""
    def _authentifier(user):
        api_client.force_authenticate(user=user)
        return api_client
    return _authentifier