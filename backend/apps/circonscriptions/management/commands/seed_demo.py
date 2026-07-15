import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.users.models import User, Role
from apps.circonscriptions.models import Circonscription
from apps.schools.models import School, Sector, TypeEcole, Milieu
from apps.teachers.models import Classe, TeacherProfile, Niveau
from apps.students.models import Student
from apps.evaluations.models import Note, Matiere, Composition
from apps.subscriptions.models import Subscription, StatutAbonnement


NOMS = ["Kouassi", "Traoré", "Koffi", "Diabaté", "Bamba", "N'Guessan", "Ouattara", "Yao", "Kouamé", "Konaté"]
PRENOMS_G = ["Kofi", "Yao", "Adama", "Ibrahim", "Moussa", "Séka"]
PRENOMS_F = ["Aya", "Awa", "Fatou", "Adjoua", "Mariam", "Akissi"]


class Command(BaseCommand):
    help = "Génère un jeu de données de démonstration (écoles, classes, élèves, notes) pour un Chef IEPP."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username", type=str, default="demo_chef",
            help="Nom d'utilisateur du Chef IEPP de démo à créer (défaut : demo_chef).",
        )
        parser.add_argument(
            "--password", type=str, default="Demo1234",
            help="Mot de passe du compte de démo (défaut : Demo1234).",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]

        self.stdout.write("Création du Chef IEPP de démonstration...")
        chef, cree = User.objects.get_or_create(
            username=username,
            defaults={
                "role": Role.CHEF_IEPP,
                "first_name": "Chef",
                "last_name": "Démonstration",
                "email": f"{username}@exemple.com",
                "is_active": True,
            },
        )
        chef.set_password(password)
        chef.save()

        circo = Circonscription.objects.filter(chef=chef).first()
        if not circo:
            circo = Circonscription.objects.create(chef=chef, nom="Circonscription de Démonstration")

        # Abonnement essai forcé à 30 jours pour laisser le temps de la démo
        Subscription.objects.update_or_create(
            chef=chef,
            defaults={
                "date_debut": timezone.now().date(),
                "date_fin": timezone.now().date() + timedelta(days=30),
                "statut": StatutAbonnement.ESSAI,
            },
        )

        secteur, _ = Sector.objects.get_or_create(nom="Secteur Démo Nord")

        self.stdout.write("Création des écoles, classes, enseignants et élèves...")
        noms_ecoles = ["EPP Démo Centre", "EPP Démo Nord", "EPP Démo Sud"]
        annee_scolaire = self._annee_scolaire_courante()

        for i, nom_ecole in enumerate(noms_ecoles):
            code = f"DEMO-{i+1:03d}"
            ecole, _ = School.objects.get_or_create(
                code=code,
                defaults={
                    "nom": nom_ecole,
                    "type_ecole": TypeEcole.PUBLIQUE,
                    "milieu": Milieu.URBAIN if i == 0 else Milieu.RURAL,
                    "adresse": f"Quartier Démo {i+1}",
                    "secteur": secteur,
                    "circonscription": circo,
                },
            )
            # S'assurer que l'école existante appartient bien à cette circonscription (relance idempotente)
            if ecole.circonscription_id != circo.id:
                ecole.circonscription = circo
                ecole.save()

            # Directeur
            directeur_username = f"demo_directeur_{i+1}"
            directeur, _ = User.objects.get_or_create(
                username=directeur_username,
                defaults={
                    "role": Role.DIRECTEUR, "first_name": "Directeur", "last_name": nom_ecole,
                    "email": f"{directeur_username}@exemple.com",
                },
            )
            directeur.set_password(password)
            directeur.save()
            if not School.objects.filter(directeur=directeur).exclude(id=ecole.id).exists():
                ecole.directeur = directeur
                ecole.save()

            # 2 classes par école
            for niveau in [Niveau.CM1, Niveau.CM2]:
                classe, _ = Classe.objects.get_or_create(ecole=ecole, niveau=niveau, libelle="A")

                # Un instituteur par classe
                inst_username = f"demo_inst_{code}_{niveau}".lower()
                instituteur, _ = User.objects.get_or_create(
                    username=inst_username,
                    defaults={
                        "role": Role.INSTITUTEUR, "first_name": "Instituteur",
                        "last_name": f"{niveau} {nom_ecole}",
                        "email": f"{inst_username}@exemple.com",
                    },
                )
                instituteur.set_password(password)
                instituteur.save()
                TeacherProfile.objects.update_or_create(
                    user=instituteur, defaults={"ecole": ecole, "classe": classe}
                )

                # 6 élèves par classe, avec des notes variées
                for e in range(6):
                    sexe = random.choice(["M", "F"])
                    prenom = random.choice(PRENOMS_G if sexe == "M" else PRENOMS_F)
                    nom = random.choice(NOMS)
                    eleve, _ = Student.objects.get_or_create(
                        nom=nom, prenoms=f"{prenom}-{code}{niveau}{e}",  # suffixe pour éviter les doublons entre runs
                        classe=classe,
                        defaults={
                            "sexe": sexe,
                            "date_naissance": date(2015, random.randint(1, 12), random.randint(1, 28)),
                            "nom_parent": f"Tuteur {nom}",
                            "contact_parent": f"07{random.randint(10000000, 99999999)}",
                        },
                    )

                    for matiere, _ in Matiere.choices:
                        for composition, _ in Composition.choices:
                            valeur = round(random.uniform(6, 19), 1)
                            Note.objects.update_or_create(
                                eleve=eleve, matiere=matiere, composition=composition,
                                annee_scolaire=annee_scolaire,
                                defaults={"valeur": valeur, "enseignant": instituteur},
                            )

        self.stdout.write(self.style.SUCCESS(
            f"\nDonnées de démonstration créées avec succès !\n"
            f"Connexion Chef IEPP : username='{username}' / password='{password}'\n"
            f"Circonscription : {circo.nom}\n"
            f"3 écoles, 6 classes, {3*2*6} élèves, notes complètes générées."
        ))

    def _annee_scolaire_courante(self):
        auj = date.today()
        debut = auj.year if auj.month >= 9 else auj.year - 1
        return f"{debut}-{debut + 1}"