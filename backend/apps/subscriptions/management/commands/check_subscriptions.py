from django.core.management.base import BaseCommand
from apps.subscriptions.models import Subscription


class Command(BaseCommand):
    help = "Actualise le statut des abonnements et signale ceux qui approchent de l'expiration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--jours-alerte", type=int, default=30,
            help="Nombre de jours avant expiration à partir duquel alerter (défaut : 30).",
        )

    def handle(self, *args, **options):
        seuil = options["jours_alerte"]

        for abonnement in Subscription.objects.select_related("chef"):
            abonnement.actualiser_statut()
            jours = abonnement.jours_restants

            if not abonnement.est_active():
                self.stdout.write(self.style.ERROR(
                    f"[EXPIRÉ] {abonnement.chef} — expiré depuis le {abonnement.date_fin}"
                ))
            elif 0 <= jours <= seuil and not abonnement.notifie_expiration:
                self.stdout.write(self.style.WARNING(
                    f"[ALERTE] {abonnement.chef} — expire dans {jours} jour(s) (le {abonnement.date_fin})"
                ))
                # TODO : brancher un envoi d'email/SMS réel ici lors de
                # l'intégration d'un service de notification (hors périmètre actuel).
                abonnement.notifie_expiration = True
                abonnement.save(update_fields=["notifie_expiration"])
            else:
                self.stdout.write(self.style.SUCCESS(
                    f"[OK] {abonnement.chef} — valide jusqu'au {abonnement.date_fin}"
                ))