from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    verbose_name = "users"

    def ready(self):
        from .signals import connecter_signaux_audit
        connecter_signaux_audit()
