from rest_framework import serializers
from .models import *
from djoser.serializers import UserCreateSerializer, UserSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

user = get_user_model()


# class UserCreateSerializer(UserCreateSerializer):
#     class Meta(UserCreateSerializer.Meta):
#         model = user
#         fields = ('id', 'first_name', 'last_name', 'phone_number', 'email', 
#                   'refferer_code_used', 'plan', 'password')


class UserInfoSerializer(UserSerializer):
    recommended_by_email = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        model = user
        fields = ('id', 'first_name', 'last_name', 'phone_number', 'email', 'is_superuser' ,'get_photo_url',
                  'date_of_birth', 'gender', 'home_address', 'status', 'local_govt', 'state_of_origin',
                  'nationality', 'image', 'code', 'plan', 'bank_name', 'account_name', 'account_number', 'date_joined',
                  'local_govt', 'state_of_origin', 'recommended_by', 'recommended_by_email')

    def get_recommended_by_email(self, obj):
        if obj.recommended_by:
            return f'{obj.recommended_by.first_name} {obj.recommended_by.last_name} - {obj.recommended_by.email}'
        return None

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)

        # Perform custom update logic here
        instance.first_name = validated_data.get(
            'first_name', instance.first_name)
        instance.last_name = validated_data.get(
            'last_name', instance.last_name)
        instance.phone_number = validated_data.get(
            'phone_number', instance.phone_number)
        instance.is_superuser = validated_data.get(
            'is_superuser', instance.is_superuser)
        instance.date_of_birth = validated_data.get(
            'date_of_birth', instance.date_of_birth)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.bank_name = validated_data.get(
            'bank_name', instance.bank_name)
        instance.account_name = validated_data.get(
            'account_name', instance.account_name)
        instance.account_number = validated_data.get(
            'account_number', instance.account_number)
        instance.nationality = validated_data.get(
            'nationality', instance.nationality)
        instance.state_of_origin = validated_data.get(
            'state_of_origin', instance.state_of_origin)
        instance.local_govt = validated_data.get(
            'local_govt', instance.local_govt)
        instance.home_address = validated_data.get(
            'home_address', instance.home_address)

        # Update image field
        if 'image' in validated_data:
            instance.image = validated_data['image']

        instance.save()
        return instance


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ('id', 'date', 'amount', 'pin', 'status',
                  'payment_proof', 'get_image_url')


class RefCodeCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = user
        fields = ('first_name', 'last_name', 'code')


class MlmSystemUserSerializer(serializers.ModelSerializer):
    class Meta(UserSerializer.Meta):
        models = user
        fields = ('id', 'status', 'date_joined', 'first_name',
                  'last_name', 'email', 'plan', 'phone_number')


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = ('id', 'user', 'amount', 'status', 'created_at',
                  'updated_at', 'balance_before', 'balance_after')


class UserAccountInfoSerializer(serializers.ModelSerializer):
    depth = serializers.IntegerField()

    class Meta:
        model = UserAccountBalance
        fields = ('total_balance', 'match_bonus_earned',
                  'referral_bonus_earned', 'depth')


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = '__all__'


class LevelInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LevelInformation
        fields = '__all__'

class ProspectActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProspectAction
        fields = '__all__'

class UserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = user
        fields = ('id', 'first_name', 'last_name', 'phone_number', 'email', 
                  'refferer_code_used', 'plan', 'password', 're_password')
    
    def create(self, validated_data):
        # Remover re_password antes de crear
        validated_data.pop('re_password', None)
        
        # Crear usuario INACTIVO por defecto
        user = super().create(validated_data)
        user.is_active = False  # ← Usuario pendiente de aprobación
        user.status = 'Inactive'
        user.save()
        
        # Notificar al superusuario por email
        self._notify_superuser(user)
        
        return user
    
    def _notify_superuser(self, user):
        """Envía email al superusuario sobre nuevo registro"""
        try:
            # Obtener superusuario
            super_user = UserAccount.objects.filter(is_superuser=True).first()
            
            if not super_user:
                print("⚠️ No hay superusuario en el sistema")
                return
            
            # Obtener info del referidor
            referrer_info = "Sin referidor"
            if user.refferer_code_used:
                try:
                    referrer = UserAccount.objects.get(code=user.refferer_code_used)
                    referrer_info = f"{referrer.first_name} {referrer.last_name} ({referrer.email})"
                except UserAccount.DoesNotExist:
                    referrer_info = "Código inválido"
            
            # URL del panel de administración
            admin_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            
            # Enviar email
            send_mail(
                subject='🔔 Nuevo usuario pendiente de aprobación',
                message=f'''Hola Administrador,

Un nuevo usuario se ha registrado y está pendiente de aprobación:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMACIÓN DEL USUARIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre: {user.first_name} {user.last_name}
Email: {user.email}
Teléfono: {user.phone_number or 'No proporcionado'}
Plan: {user.plan}
Referido por: {referrer_info}
Fecha de registro: {user.date_joined.strftime('%d/%m/%Y %H:%M')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por favor, revisa y aprueba esta solicitud en:
{admin_url}/admin/usuarios-pendientes

Saludos,
Sistema Automático''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[super_user.email],
                fail_silently=True,
            )
            
            print(f"✅ Email de notificación enviado a {super_user.email}")
            
        except Exception as e:
            print(f"❌ Error enviando notificación al superusuario: {e}")


def serialize_prospect_simple(prospect):
    """
    Serializa prospecto basado en el modelo Prospect
    
    Campos:
    - country: País (ej: "Bolivia")
    - departamento: Departamento de Bolivia (ej: "La Paz")
    - prospect_agent: User agent del navegador
    - NO incluye 'ip' (eliminado del modelo)
    """
    return {
        'id': str(prospect.id),
        'prospect_id': str(prospect.prospect_id) if prospect.prospect_id else None,
        'user_code': prospect.user_code,
        'first_name': prospect.first_name or '',
        'last_name': prospect.last_name or '',
        'email': prospect.email or '',
        'phone': prospect.phone or '',
        'country': prospect.country or '',  # ← País (Bolivia)
        'departamento': prospect.departamento or '',  # ← Departamento boliviano
        'prospect_agent': prospect.prospect_agent or '',  # ← User agent completo
        'created_at': prospect.created_at.isoformat() if prospect.created_at else None,
    }


def serialize_action_simple(action):
    """
    Serializa acción basado en el modelo ProspectAction
    NO incluye 'ip' (eliminado del modelo)
    """
    return {
        'id': action.id,
        'event_name': action.event_name,
        'details': action.details or {},
        'timestamp': action.timestamp.isoformat() if action.timestamp else None,
        'path': action.path or '',
        'session_id': action.session_id or '',
        # ip eliminado del modelo
    }
