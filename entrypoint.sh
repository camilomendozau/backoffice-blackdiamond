#!/bin/bash
set -e

export DJANGO_SETTINGS_MODULE=backend.settings

echo "📦 Aplicando migraciones..."
python manage.py migrate --noinput

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "🚀 Iniciando Daphne..."
exec daphne -b 0.0.0.0 -p 8000 backend.asgi:application