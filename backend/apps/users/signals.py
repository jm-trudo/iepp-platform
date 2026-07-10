from django.db.models.signals import post_save, post_delete
from django.apps import apps as django_apps
from .middleware import get_current_user
from .models import AuditLog, ActionAudit

# Modèles explicitement exclus de la journalisation (bruit ou risque de boucle).
MODELES_EXCLUS = {"AuditLog", "Session", "LogEntry", "MigrationRecorder"}

# Apps métier à journaliser — correspond à l'architecture définie en Section 1.
APPS_JOURNALISEES = [
    "users", "schools", "teachers", "students",
    "evaluations", "authorizations", "subscriptions",
]


def _enregistrer(action, instance):
    nom_modele = instance.__class__.__name__
    if nom_modele in MODELES_EXCLUS:
        return
    AuditLog.objects.create(
        utilisateur=get_current_user() if get_current_user() and get_current_user().is_authenticated else None,
        action=action,
        modele=nom_modele,
        objet_id=str(instance.pk),
        objet_repr=str(instance)[:255],
    )


def _apres_sauvegarde(sender, instance, created, **kwargs):
    _enregistrer(ActionAudit.CREATION if created else ActionAudit.MODIFICATION, instance)


def _apres_suppression(sender, instance, **kwargs):
    _enregistrer(ActionAudit.SUPPRESSION, instance)


def connecter_signaux_audit():
    """
    Connecte automatiquement post_save/post_delete à tous les modèles
    des apps métier listées ci-dessus. Appelé depuis AppConfig.ready().
    """
    for app_label in APPS_JOURNALISEES:
        try:
            app_config = django_apps.get_app_config(app_label)
        except LookupError:
            continue
        for model in app_config.get_models():
            if model.__name__ in MODELES_EXCLUS:
                continue
            post_save.connect(_apres_sauvegarde, sender=model, weak=False)
            post_delete.connect(_apres_suppression, sender=model, weak=False)