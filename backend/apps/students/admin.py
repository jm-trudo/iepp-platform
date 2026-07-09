from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("nom", "prenoms", "classe", "ecole", "sexe", "date_naissance")
    list_filter = ("ecole", "classe", "sexe")
    search_fields = ("nom", "prenoms")
