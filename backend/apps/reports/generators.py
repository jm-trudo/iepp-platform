from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from apps.schools.models import School
from apps.teachers.models import Classe
from apps.students.models import Student
from apps.evaluations.models import Note, Matiere, Composition
from .pdf import generer_pdf, tableau_standard

_styles = getSampleStyleSheet()


def liste_ecoles_pdf(queryset):
    entetes = ["Nom", "Code", "Type", "Milieu", "Directeur", "Secteur"]
    lignes = [entetes]
    for e in queryset:
        lignes.append([
            e.nom, e.code, e.get_type_ecole_display(), e.get_milieu_display(),
            e.directeur.get_full_name() if e.directeur else "—",
            e.secteur.nom if e.secteur else "—",
        ])
    contenu = [tableau_standard(lignes)]
    return generer_pdf("Liste des écoles", contenu)


def liste_enseignants_pdf(queryset):
    entetes = ["Nom", "Matricule", "École", "Classe"]
    lignes = [entetes]
    for u in queryset:
        profil = getattr(u, "teacher_profile", None)
        lignes.append([
            u.get_full_name() or u.username,
            u.matricule or "—",
            profil.ecole.nom if profil and profil.ecole else "—",
            str(profil.classe) if profil and profil.classe else "—",
        ])
    contenu = [tableau_standard(lignes)]
    return generer_pdf("Liste des enseignants", contenu)


def liste_eleves_pdf(queryset, titre_complement=""):
    entetes = ["Nom", "Prénoms", "Classe", "École", "Parent/Tuteur", "Contact"]
    lignes = [entetes]
    for el in queryset:
        lignes.append([
            el.nom, el.prenoms, str(el.classe), el.ecole.nom,
            el.nom_parent or "—", el.contact_parent or "—",
        ])
    contenu = [tableau_standard(lignes)]
    titre = "Liste des élèves" + (f" — {titre_complement}" if titre_complement else "")
    return generer_pdf(titre, contenu)


def bulletin_eleve_pdf(eleve, annee_scolaire):
    notes = Note.objects.filter(eleve=eleve, annee_scolaire=annee_scolaire).order_by("matiere", "composition")

    infos = [
        Paragraph(f"<b>Élève :</b> {eleve.nom} {eleve.prenoms}", _styles["Normal"]),
        Paragraph(f"<b>Classe :</b> {eleve.classe}", _styles["Normal"]),
        Paragraph(f"<b>École :</b> {eleve.ecole.nom}", _styles["Normal"]),
        Paragraph(f"<b>Année scolaire :</b> {annee_scolaire}", _styles["Normal"]),
        Spacer(1, 0.6 * cm),
    ]

    entetes = ["Matière"] + [label for _, label in Composition.choices]
    par_matiere = {}
    for n in notes:
        par_matiere.setdefault(n.matiere, {})[n.composition] = n.valeur

    lignes = [entetes]
    for code_matiere, label_matiere in Matiere.choices:
        ligne = [label_matiere]
        for code_comp, _ in Composition.choices:
            valeur = par_matiere.get(code_matiere, {}).get(code_comp)
            ligne.append(f"{valeur}/20" if valeur is not None else "—")
        lignes.append(ligne)

    contenu = infos + [tableau_standard(lignes)]
    return generer_pdf(f"Bulletin scolaire — {eleve.nom} {eleve.prenoms}", contenu)


def statistiques_pdf(donnees_dashboard, annee_scolaire=None):
    stats = donnees_dashboard["statistiques_generales"]
    lignes_stats = [
        ["Indicateur", "Valeur"],
        ["Nombre d'écoles", stats["nombre_ecoles"]],
        ["Nombre d'enseignants", stats["nombre_enseignants"]],
        ["Nombre d'élèves", stats["nombre_eleves"]],
        ["Nombre de classes", stats["nombre_classes"]],
        ["Nombre de directeurs", stats["nombre_directeurs"]],
        ["Demandes en attente", stats["nombre_demandes_en_attente"]],
    ]

    lignes_matieres = [["Matière", "Moyenne /20", "Nb notes"]]
    for m in donnees_dashboard["moyennes_par_matiere"]:
        lignes_matieres.append([m["matiere_display"], m["moyenne"], m["nombre_notes"]])

    titre = "Statistiques de la circonscription"
    if annee_scolaire:
        titre += f" — {annee_scolaire}"

    contenu = [
        Paragraph("Statistiques générales", _styles["Heading2"]),
        tableau_standard(lignes_stats),
        Spacer(1, 0.8 * cm),
        Paragraph("Moyennes par matière", _styles["Heading2"]),
        tableau_standard(lignes_matieres),
    ]
    return generer_pdf(titre, contenu)