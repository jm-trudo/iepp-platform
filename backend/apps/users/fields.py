from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _get_fernet():
    key = settings.FIELD_ENCRYPTION_KEY
    return Fernet(key.encode() if isinstance(key, str) else key)


class EncryptedCharField(models.CharField):
    """
    CharField chiffré de façon transparente (AES via Fernet) :
    stocké chiffré en base, déchiffré automatiquement à la lecture.
    """

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        return _get_fernet().encrypt(str(value).encode()).decode()

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value
        try:
            return _get_fernet().decrypt(value.encode()).decode()
        except InvalidToken:
            # Valeur pré-existante non chiffrée (avant migration) : renvoyée telle quelle.
            return value