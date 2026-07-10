from rest_framework_simplejwt.authentication import JWTAuthentication
from .middleware import _thread_locals


class AuditingJWTAuthentication(JWTAuthentication):
    """
    Variante de JWTAuthentication qui, une fois l'utilisateur identifié,
    le rend disponible aux signaux via le stockage thread-local du
    middleware d'audit.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, _token = result
            _thread_locals.user = user
        return result