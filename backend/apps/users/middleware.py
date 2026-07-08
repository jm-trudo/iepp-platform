class AuditLogMiddleware:
    """
    Squelette du middleware de journalisation des actions utilisateurs
    (qui a créé/modifié quelle donnée, à quelle date).
    Sera implémenté en détail dans la section "Sécurité / Journal des actions".
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response
