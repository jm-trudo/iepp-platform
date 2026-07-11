bind = "127.0.0.1:8000"
workers = 3  # règle empirique : (2 x nombre de coeurs CPU) + 1
worker_class = "sync"
timeout = 60
accesslog = "logs/gunicorn-access.log"
errorlog = "logs/gunicorn-error.log"
loglevel = "info"