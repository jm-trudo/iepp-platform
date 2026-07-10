from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "first_name", "last_name", "is_active")
    list_filter = ("role", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Informations IEPP", {"fields": ("role", "telephone", "matricule")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Informations IEPP", {"fields": ("role", "telephone", "matricule")}),
    )
from .models import DirectorProfile


@admin.register(DirectorProfile)
class DirectorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "sexe", "date_naissance", "date_prise_fonction")
    search_fields = ("user__username", "user__last_name")

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("date_action", "utilisateur", "action", "modele", "objet_id")
    list_filter = ("action", "modele")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False  # Le journal ne se remplit que via les signaux    