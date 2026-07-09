from io import BytesIO
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_authorization_pdf(demande):
    """Génère le PDF officiel d'une demande d'autorisation déjà tranchée."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitreIEPP", parent=styles["Title"], textColor=colors.HexColor("#E07B00"),
    )
    elements = []

    elements.append(Paragraph("CIRCONSCRIPTION DE L'ENSEIGNEMENT PRÉSCOLAIRE ET PRIMAIRE", styles["Heading3"]))
    elements.append(Paragraph("AUTORISATION D'ABSENCE", title_style))
    elements.append(Spacer(1, 1 * cm))

    infos = [
        ["Agent", demande.agent.get_full_name() or demande.agent.username],
        ["Fonction", demande.fonction_agent],
        ["École", demande.ecole.nom if demande.ecole else "—"],
        ["Motif", demande.motif],
        ["Date de départ", demande.date_depart.strftime("%d/%m/%Y")],
        ["Date de retour", demande.date_retour.strftime("%d/%m/%Y")],
        ["Nombre de jours", str(demande.nombre_jours)],
    ]
    table = Table(infos, colWidths=[5 * cm, 11 * cm])
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#FFF3E0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 1 * cm))

    decision_couleur = colors.HexColor("#2E7D32") if demande.statut == "ACCEPTEE" else colors.HexColor("#C62828")
    elements.append(Paragraph(
        f"<b>Décision :</b> <font color='{decision_couleur.hexval()}'>{demande.get_statut_display()}</font>",
        styles["Normal"],
    ))
    if demande.commentaire_chef:
        elements.append(Paragraph(f"<b>Commentaire :</b> {demande.commentaire_chef}", styles["Normal"]))
    elements.append(Spacer(1, 1.5 * cm))

    signataire = demande.chef.get_full_name() if demande.chef else "—"
    date_decision = demande.date_decision.strftime("%d/%m/%Y à %H:%M") if demande.date_decision else "—"
    elements.append(Paragraph(f"Fait le {date_decision}", styles["Normal"]))
    elements.append(Spacer(1, 0.5 * cm))
    elements.append(Paragraph(f"Le Chef de Circonscription : <b>{signataire}</b>", styles["Normal"]))
    elements.append(Paragraph("<i>(Document signé électroniquement)</i>", styles["Italic"]))

    doc.build(elements)
    buffer.seek(0)
    return buffer