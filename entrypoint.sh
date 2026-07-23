#!/bin/bash
set -e

echo "📦 Aplicando migraciones..."
python manage.py migrate --noinput

echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "👤 Creando superadmin si no existe..."
python manage.py shell << 'EOF'
import os
from dashboard.models import UserAccount

username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
email    = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@admin.com')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin')

if not UserAccount.objects.filter(username=username).exists():
    UserAccount.objects.create_superuser(
        username=username,
        email=email,
        password=password
    )
    print(f"✅ Superadmin '{username}' creado.")
else:
    print(f"ℹ️  '{username}' ya existe.")
EOF

echo "🚀 Iniciando Daphne..."
exec daphne -b 0.0.0.0 -p 8000 backend.asgi:application