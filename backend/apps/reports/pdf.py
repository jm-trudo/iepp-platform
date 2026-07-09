from io import BytesIO
from django.conf import settings
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

ORANGE = colors.HexColor("#E07B00")
VERT = colors.HexColor("#2E7D32")


def _styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("TitreIEPP", parent=styles["Title"], textColor=ORANGE, fontSize=16))
    return styles


def nouveau_document(buffer):
    return SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        leftMargin=1.5 * cm, rightMargin=1.5 * cm,
    )


def entete(titre):
    """En-tête officiel commun à tous les documents : circonscription, titre, date."""
    styles = _styles()
    elements = [
        Paragraph(settings.IEPP_CIRCONSCRIPTION_NOM.upper(), styles["Heading3"]),
        Paragraph(titre, styles["TitreIEPP"]),
        Paragraph(f"Édité le {timezone.now().strftime('%d/%m/%Y à %H:%M')}", styles["Normal"]),
        Spacer(1, 0.8 * cm),
    ]
    return elements, styles


def tableau_standard(donnees, largeurs=None):
    table = Table(donnees, colWidths=largeurs)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
    ]))
    return table


def generer_pdf(titre, elements_contenu):
    buffer = BytesIO()
    doc = nouveau_document(buffer)
    elements, styles = entete(titre)
    elements += elements_contenu
    doc.build(elements)
    buffer.seek(0)
    return buffer