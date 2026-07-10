import threading

_thread_locals = threading.local()


def get_current_user():
    return getattr(_thread_locals, "user", None)


class AuditLogMiddleware:
    """
    Rend l'utilisateur de la requête courante accessible aux signaux
    Django (post_save/post_delete), qui n'ont normalement pas accès
    à la requête HTTP.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, "user", None)
        try:
            response = self.get_response(request)
        finally:
            _thread_locals.user = None
        return response