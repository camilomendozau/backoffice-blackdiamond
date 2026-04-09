from rest_framework import serializers
from .models import *
from djoser.serializers import UserCreateSerializer, UserSerializer
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction


user = get_user_model()


class UserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        #print("Init UserCreateSerializer")
        model = user
        fields = ('id', 'first_name', 'last_name', 'phone_number', 'email', 
                  'refferer_code_used', 'password')

class UserInfoSerializer(UserSerializer):
    recommended_by_email = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        model = user
        fields = (
            'id', 'first_name', 'last_name', 'phone_number', 'email', 'is_superuser',
            'get_photo_url', 'date_of_birth', 'gender',
            'home_address', 'status', 'local_govt', 'state_of_origin',
            'nationality', 'image', 'code', 'bank_name', 'account_name',
            'account_number', 'date_joined', 'recommended_by', 'recommended_by_email'
        )
        read_only_fields = ('is_superuser', 'code', 'date_joined', 'email')

    def get_recommended_by_email(self, obj):
        if obj.recommended_by:
            return f'{obj.recommended_by.first_name} {obj.recommended_by.last_name} - {obj.recommended_by.email}'
        return None

    def update(self, instance, validated_data):
        image = validated_data.pop('image', None)

        # super() ya actualiza todos los campos y hace .save()
        instance = super().update(instance, validated_data)

        if image is not None:
            instance.image = image
            instance.save()

        instance.refresh_from_db()
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

class ProspectPageConfigSerializer(serializers.ModelSerializer):
    # phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    # referer_image = serializers.CharField(source='user.image.url', read_only=True)
    class Meta:
        model = ProspectPageConfig
        fields = [
                  'url',
                  'initial_video_url',
                  'presentation_video_url',
                  'catalog_video_url',
                  'why_bioliffe_video_url',
                ]


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
