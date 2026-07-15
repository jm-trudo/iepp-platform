from rest_framework import serializers
from .models import Circonscription


class CirconscriptionSerializer(serializers.ModelSerializer):
    chef_nom = serializers.CharField(source="chef.get_full_name", read_only=True)
    nombre_ecoles = serializers.SerializerMethodField()

    class Meta:
        model = Circonscription
        fields = ["id", "nom", "chef", "chef_nom", "nombre_ecoles", "date_creation"]
        read_only_fields = ["id", "chef", "date_creation"]

    def get_nombre_ecoles(self, obj):
        return obj.ecoles.count()