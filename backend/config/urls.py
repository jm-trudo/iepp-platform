from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="API Plateforme IEPP",
        default_version="v1",
        description="API REST de la plateforme de gestion de circonscription scolaire",
    ),
    public=False,
    permission_classes=(permissions.IsAuthenticated,),
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentification JWT
    path("api/auth/", include("apps.users.urls")),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Modules métier
    path("api/schools/", include("apps.schools.urls")),
    path("api/teachers/", include("apps.teachers.urls")),
    path("api/students/", include("apps.students.urls")),
    path("api/evaluations/", include("apps.evaluations.urls")),
    path("api/authorizations/", include("apps.authorizations.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/subscriptions/", include("apps.subscriptions.urls")),

    # Documentation Swagger
    path("api/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
