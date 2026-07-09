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
