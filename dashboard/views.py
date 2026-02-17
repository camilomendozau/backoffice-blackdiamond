# dashboard/views.py

from django.db import transaction
from .utils import MLMSystem, User
from django.shortcuts import render
from .models import *
from .utils import *
from rest_framework import generics
from .serializer import *
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.http import JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from djoser.views import UserViewSet
from djoser import signals
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone


def process_mlm_system():
    super_user = UserAccount.objects.filter(is_superuser=True).first()
    if super_user is not None:
        super_user_email = super_user.email

        all_active_users = list(ActiveUser.objects.all().exclude(
            is_superuser=True).values_list('email', 'recommended_by').order_by('id'))
        all_active_users.insert(0, super_user_email)

        mlm_system_test = MLMSystem(all_active_users)
        tree = mlm_system_test.print_binary_tree()
        print(all_active_users)

        return mlm_system_test
    else:
        print("No superuser found in the database")
        return


class PaymentView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request, *args, **kwargs):
        payment_info = Payment.objects.filter(user=self.request.user)
        serializer = PaymentSerializer(payment_info, many=True)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        payment_proof = request.FILES.get('payment_proof')
        if payment_proof:
            payment = Payment.objects.get(user=self.request.user)
            payment.payment_proof = payment_proof
            payment.save()
            return Response({'message': 'Payment proof updated successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Payment proof not provided'}, status=status.HTTP_400_BAD_REQUEST)


class UserUpdateView(UserViewSet):
    serializer_class = UserInfoSerializer

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        return response


class RefCodeCheckView(generics.RetrieveAPIView):
    serializer_class = RefCodeCheckSerializer
    permission_classes = [AllowAny,]
    lookup_field = 'code'

    def get_queryset(self):
        return UserAccount.objects.all()


class DownlineView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request):
        if self.request.user.plan == "Premium":
            current_user_downline = process_mlm_system().get_downline_by_depth(
                request.user.email, 8)
        elif self.request.user.plan == "Eureka":
            current_user_downline = process_mlm_system().get_downline_by_depth(
                request.user.email, 6)

        downline_user_list = []
        for user in current_user_downline[1:]:
            find_user = UserAccount.objects.get(email=user)
            downline_user_list.append(find_user)
        queryset = downline_user_list
        serializer = MlmSystemUserSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RefferalView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request):
        if self.request.user.plan == "Premium":
            current_user_referrals = process_mlm_system().get_downline_by_depth(
                request.user.email, 8)
        elif self.request.user.plan == "Eureka":
            current_user_referrals = process_mlm_system().get_downline_by_depth(
                request.user.email, 6)

        referal_user_list = []
        for user in current_user_referrals[1:]:
            find_user = UserAccount.objects.get(email=user)
            user_ref_code = find_user.refferer_code_used
            if user_ref_code == self.request.user.code:
                referal_user_list.append(find_user)
        queryset = referal_user_list
        serializer = MlmSystemUserSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WithdrawalView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request, *args, **kwargs):
        withdrawals = Withdrawal.objects.filter(user=request.user)
        serializer = WithdrawalSerializer(withdrawals, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        user_account = UserAccountBalance.objects.get(user=request.user)
        balance = user_account.total_balance
        amount = request.data.get('amount')
        is_any_pending_withdrawal = Withdrawal.objects.filter(
            user=request.user, status='Pending').exists()

        if not is_any_pending_withdrawal:
            if float(amount) <= balance:
                balance_after = balance - float(amount)

                withdrawal = Withdrawal.objects.create(
                    user=request.user, amount=amount, balance_before=balance, 
                    balance_after=balance_after, status='Pending')

                serializer = WithdrawalSerializer(withdrawal)
                return Response(serializer.data)
            else:
                return Response({'error': 'Insufficient balance.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'You still have a Pending Withdrawal awaiting approval'}, status=status.HTTP_400_BAD_REQUEST)


class UserAccountInfoView(generics.RetrieveAPIView):
    serializer_class = UserAccountInfoSerializer
    permission_classes = [IsAuthenticated,]

    def get_object(self):
        user_account_info = UserAccountBalance.objects.get(user=self.request.user)
        depth = process_mlm_system().find_user_depth(self.request.user.email)
        user_account_info.depth = depth
        return user_account_info


class UserNotificationView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request, *args, **kwargs):
        notifications = UserNotification.objects.filter(user=request.user)
        serializer = UserNotificationSerializer(notifications, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        notification_id = request.data.get('notificationId')
        notification = UserNotification.objects.get(id=notification_id)
        notification.is_read = True
        notification.save()
        return Response({'detail': 'Notification marked as read.'})


class LevelInformationView(APIView):
    permission_classes = [IsAuthenticated,]

    def get(self, request, *args, **kwargs):
        level_information = LevelInformation.objects.all()
        serializer = LevelInformationSerializer(level_information, many=True)
        return Response(serializer.data)


# ==================== SERIALIZERS INLINE ====================

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


# ==================== VISTAS DE PROSPECT ====================

class ProspectActionView(APIView):
    """
    POST /api/prospect-actions/
    
    Recibe acciones desde ProspectPage y las guarda en BD
    Transmite vía WebSocket al Dashboard en tiempo real
    
    Body esperado:
    {
        "session_id": "uuid",
        "id_ref": "uuid (código del usuario)",
        "action": "page_view" | "video_start" | "video_end" | "form_submit",
        "prospect_id": "uuid",
        "first_name": "Juan",
        "last_name": "Pérez",
        "email": "juan@example.com",
        "phone": "+591 70123456",
        "country": "Bolivia",
        "departamento": "La Paz",
        "user_agent": "Mozilla/5.0...",
        "url": "/landing",
        "details": {}
    }
    """
    permission_classes = []
    CACHE_TIMEOUT = 60 * 60 * 24  # 24 horas
    
    def post(self, request):
        try:
            # 1. Extraer datos requeridos
            session_id = request.data.get('session_id')
            id_ref = request.data.get('id_ref')
            action = request.data.get('action')
            prospect_id = request.data.get('prospect_id')
            
            # Validaciones básicas
            if not all([session_id, id_ref, action]):
                return Response(
                    {'detail': 'session_id, id_ref, and action are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 2. Verificar código de referencia
            user_account = self._get_user_account(id_ref)
            if not user_account:
                return Response(
                    {'detail': 'Invalid reference code'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 3. Obtener o crear prospecto (con caché)
            prospect, created = self._get_or_create_prospect(
                prospect_id, id_ref, session_id, request
            )
            
            # 4. Actualizar datos del prospecto si ya existe
            if not created:
                self._update_prospect_if_needed(prospect, request.data)
            
            # 5. Crear la acción (SIN campo ip)
            action_obj = ProspectAction.objects.create(
                prospect=prospect,
                event_name=action,
                details=request.data.get('details', {}),
                timestamp=request.data.get('timestamp', timezone.now()),
                path=request.data.get('url', ''),
                session_id=session_id,
                # ip eliminado del modelo
            )
            
            # 6. BROADCAST WebSocket en tiempo real
            if created:
                self._broadcast_new_prospect(id_ref, prospect)
            
            self._broadcast_new_action(id_ref, str(prospect.id), action_obj, prospect)
            
            # 7. Respuesta exitosa
            return Response({
                'ok': True,
                'prospect_id': str(prospect.id),
                'action_id': action_obj.id,
                'created': created
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Error in ProspectActionView")
            
            return Response(
                {'detail': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_user_account(self, id_ref):
        """Obtiene UserAccount con caché para evitar consultas repetidas"""
        cache_key = f'user_account_code:{id_ref}'
        user_account = cache.get(cache_key)
        
        if not user_account:
            try:
                user_account = UserAccount.objects.get(code=id_ref)
                cache.set(cache_key, user_account, 60 * 60)  # 1 hora
            except UserAccount.DoesNotExist:
                return None
        
        return user_account
    
    def _get_or_create_prospect(self, prospect_id, id_ref, session_id, request):
        """Obtiene o crea prospecto con caché"""
        cache_key = f'prospect:{id_ref}:{session_id}'
        cached_prospect_id = cache.get(cache_key)
        
        if cached_prospect_id:
            try:
                prospect = Prospect.objects.get(id=cached_prospect_id)
                return prospect, False
            except Prospect.DoesNotExist:
                cache.delete(cache_key)
        
        # Crear o buscar en BD
        prospect, created = Prospect.objects.get_or_create(
            prospect_id=prospect_id,
            defaults={
                'user_code': id_ref,
                'prospect_agent': request.data.get('user_agent', ''),
                'country': request.data.get('country', ''),  # ← País
                'departamento': request.data.get('departamento', ''),  # ← Departamento boliviano
                'first_name': request.data.get('first_name', ''),
                'last_name': request.data.get('last_name', ''),
                'email': request.data.get('email', ''),
                'phone': request.data.get('phone', ''),
            }
        )
        
        # Guardar en caché
        cache.set(cache_key, prospect.id, self.CACHE_TIMEOUT)
        return prospect, created
    
    def _update_prospect_if_needed(self, prospect, data):
        """
        Actualiza campos vacíos del prospecto
        Solo actualiza si el campo está vacío (NULL o '')
        """
        fields_to_update = []
        
        # Mapeo completo de campos actualizables
        field_mapping = {
            'email': 'email',
            'phone': 'phone',
            'first_name': 'first_name',
            'last_name': 'last_name',
            'country': 'country',  # ← País
            'departamento': 'departamento',  # ← Departamento
        }
        
        # Solo actualizar campos que estén vacíos
        for data_field, model_field in field_mapping.items():
            value = data.get(data_field)
            if value and not getattr(prospect, model_field):
                setattr(prospect, model_field, value)
                fields_to_update.append(model_field)
        
        # Guardar solo si hay cambios
        if fields_to_update:
            prospect.save(update_fields=fields_to_update)
    
    def _broadcast_new_action(self, user_code, prospect_id, action_obj, prospect):
        """Transmite nueva acción vía WebSocket a todos los dashboards conectados"""
        channel_layer = get_channel_layer()
        
        action_data = serialize_action_simple(action_obj)
        prospect_data = serialize_prospect_simple(prospect)
        
        # Broadcast al grupo de este user_code (todos sus prospectos)
        async_to_sync(channel_layer.group_send)(
            f'prospect_actions_{user_code}',
            {
                'type': 'prospect_action_created',
                'action': action_data,
                'prospect': prospect_data
            }
        )
        
        # Broadcast al grupo de este prospecto específico
        async_to_sync(channel_layer.group_send)(
            f'prospect_{prospect_id}',
            {
                'type': 'action_created',
                'action': action_data
            }
        )
    
    def _broadcast_new_prospect(self, user_code, prospect):
        """Transmite nuevo prospecto vía WebSocket"""
        channel_layer = get_channel_layer()
        
        prospect_data = serialize_prospect_simple(prospect)
        
        async_to_sync(channel_layer.group_send)(
            f'prospect_actions_{user_code}',
            {
                'type': 'prospect_created',
                'prospect': prospect_data
            }
        )
    
    def _get_client_ip(self, request):
        """
        Obtiene la IP real del cliente
        NOTA: Función mantenida para uso futuro, aunque 'ip' fue eliminado del modelo
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ProspectListView(APIView):
    """GET /api/prospects/?user_code=<uuid>"""
    permission_classes = []
    
    def get(self, request):
        user_code = request.query_params.get('user_code')
        
        if not user_code:
            return Response(
                {'detail': 'user_code is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener últimos 100 prospectos
        prospects = Prospect.objects.filter(
            user_code=user_code
        ).order_by('-created_at')[:100]
        
        prospects_data = [serialize_prospect_simple(p) for p in prospects]
        
        return Response({
            'total': len(prospects_data),
            'prospects': prospects_data
        })


class ProspectDetailView(APIView):
    """GET /api/prospect/<prospect_id>/"""
    permission_classes = []
    
    def get(self, request, prospect_id):
        try:
            # Obtener prospecto con acciones relacionadas
            prospect = Prospect.objects.prefetch_related('prospect_action').get(id=prospect_id)
            actions = prospect.prospect_action.all().order_by('-timestamp')
            
            # Serializar
            prospect_data = serialize_prospect_simple(prospect)
            prospect_data['actions'] = [serialize_action_simple(a) for a in actions]
            prospect_data['total_actions'] = actions.count()
            
            return Response(prospect_data)
            
        except Prospect.DoesNotExist:
            return Response(
                {'detail': 'Prospect not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

# dashboard/views.py

class ProspectCheckView(APIView):
    """
    GET /api/prospect-check/?prospect_id=<uuid>
    
    Verifica si un prospecto ya tiene sus datos completos
    Retorna información del prospecto y si necesita llenar el formulario
    """
    permission_classes = []
    
    def get(self, request):
        prospect_id = request.query_params.get('prospect_id')
        
        if not prospect_id:
            return Response(
                {'detail': 'prospect_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            prospect = Prospect.objects.get(prospect_id=prospect_id)
            
            # Verificar si tiene todos los datos requeridos
            has_complete_data = all([
                prospect.first_name,
                prospect.last_name,
                prospect.email,
                prospect.phone,
                prospect.departamento
            ])
            
            return Response({
                'exists': True,
                'has_complete_data': has_complete_data,
                'prospect': {
                    'id': str(prospect.id),
                    'first_name': prospect.first_name or '',
                    'last_name': prospect.last_name or '',
                    'email': prospect.email or '',
                    'phone': prospect.phone or '',
                    'departamento': prospect.departamento or '',
                }
            })
            
        except Prospect.DoesNotExist:
            return Response({
                'exists': False,
                'has_complete_data': False,
                'prospect': None
            })

# ==================== MLM SYSTEM FUNCTIONS ====================

def credit_users(user_email, user_downline_by_depth, expected_users_by_depth, amounts_to_credit):
    credited_users = []
    user = UserAccount.objects.get(email=user_email)

    for depth, downline_count in enumerate(user_downline_by_depth, start=1):
        expected_count = expected_users_by_depth[depth - 1]

        if downline_count == expected_count:
            credited_amount = amounts_to_credit[depth - 1]
            already_credited = MatchBonus.objects.filter(
                user=user, user_depth=depth).exists()

            if not already_credited:
                credited_user = MatchBonus.objects.create(
                    user=user, user_depth=depth, credited_amount=credited_amount)
                credited_users.append(credited_user)

    return credited_users


def credit_users_for_mlm_system(mlm_system):
    credited_users = []

    for user in mlm_system.users.keys():
        current_user = UserAccount.objects.get(email=user)

        if current_user.plan == "Premium":
            user_downline_by_depth = mlm_system.count_users_by_depth_for_user(user, 8)
            expected_users_by_depth = [2, 4, 8, 16, 32, 64, 128, 256]
            amounts_to_credit = [3000, 5000, 3000, 20000, 5000, 35000, 7000, 1000000]
        elif current_user.plan == "Eureka":
            user_downline_by_depth = mlm_system.count_users_by_depth_for_user(user, 6)
            expected_users_by_depth = [2, 4, 8, 16, 32, 64]
            amounts_to_credit = [2000, 5000, 3000, 15000, 5000, 250000]

        credited_users.extend(credit_users(
            user, user_downline_by_depth, expected_users_by_depth, amounts_to_credit))

    return credited_users


def credit_user_referral_bonus(user_email, user_downlines, amount_to_credit):
    credited_users = []
    current_user = UserAccount.objects.get(email=user_email)
    current_user_referral_code = current_user.code

    for user in user_downlines[1:]:
        user_info = UserAccount.objects.get(email=user)
        user_info_referral_code_used = user_info.refferer_code_used
        user_full_name = f"{user_info.first_name}  {user_info.last_name}"
        user_info_email = user_info.email

        if current_user_referral_code == user_info_referral_code_used:
            referral_bonus = amount_to_credit
            already_credited = ReferralBonus.objects.filter(
                referred_user_email=user_info_email).exists()

            if not already_credited:
                credited_user = ReferralBonus.objects.create(
                    user=current_user, referred_user_full_name=user_full_name, 
                    referred_user_email=user_info_email, credited_amount=referral_bonus)
                credited_users.append(credited_user)
    
    return credited_users


def credit_users_referral_bonus_mlm_system(mlm_system):
    credited_users_referral = []

    for user in mlm_system.users:
        current_user = UserAccount.objects.get(email=user)
        if current_user.plan == "Premium":
            user_downline = mlm_system.get_downline_by_depth(user, 8)
        elif current_user.plan == "Eureka":
            user_downline = mlm_system.get_downline_by_depth(user, 6)

        amount_to_credit = 500

        credited_users_referral.extend(credit_user_referral_bonus(
            user, user_downline, amount_to_credit))
    
    return credited_users_referral


def initialized_match_and_referral_bonus_payment():
    mlm = process_mlm_system()
    match_bonus_payment_system = credit_users_for_mlm_system(mlm)
    referral_bonus_payment_system = credit_users_referral_bonus_mlm_system(mlm)