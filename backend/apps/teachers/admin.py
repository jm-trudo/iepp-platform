from django.contrib import admin
from .models import Classe, TeacherProfile


@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ("__str__", "ecole", "niveau", "libelle")
    list_filter = ("ecole", "niveau")


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "ecole", "classe", "sexe", "date_affectation")
    list_filter = ("ecole", "classe")