from django.urls import path
from .views import (
    DashboardView, EcolesPdfView, EnseignantsPdfView,
    ElevesPdfView, BulletinPdfView, StatistiquesPdfView,
)

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("ecoles/pdf/", EcolesPdfView.as_view(), name="ecoles-pdf"),
    path("enseignants/pdf/", EnseignantsPdfView.as_view(), name="enseignants-pdf"),
    path("eleves/pdf/", ElevesPdfView.as_view(), name="eleves-pdf"),
    path("bulletin/<int:eleve_id>/pdf/", BulletinPdfView.as_view(), name="bulletin-pdf"),
    path("statistiques/pdf/", StatistiquesPdfView.as_view(), name="statistiques-pdf"),
]