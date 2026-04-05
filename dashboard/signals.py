from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from dashboard.models import *
from dashboard.views import initialized_match_and_referral_bonus_payment
from django.db import transaction
from django.core.mail import send_mail

@receiver(post_save, sender=UserAccount)
def create_user_account_info(sender, instance, created, **kwargs):
    """
    Crea el balance y payment SOLO cuando el usuario es aprobado (is_active=True)
    """
    # No ejecutar si es un usuario nuevo (lo maneja handle_new_user_registration)
    if created:
        return
    
    # Solo ejecutar cuando el usuario se activa (aprobación)
    if not instance.is_active:
        return
    
    # Verificar que no tenga ya un balance creado
    if UserAccountBalance.objects.filter(user=instance).exists():
        return
       
    # Crear balance
    UserAccountBalance.objects.create(user=instance)
    
    # Crear payment según plan
    if instance.plan == "Premium":
        Payment.objects.create(user=instance, amount='15000')
    elif instance.plan == "Eureka":
        Payment.objects.create(user=instance, amount='15500')
    
    # Inicializar sistema MLM
    initialized_match_and_referral_bonus_payment()

@receiver(post_save, sender=UserAccount)
def create_prospect_page_config(sender, instance, created, **kwargs):
    if created:  #solo cuando el usuario es NUEVO, no cuando se actualiza
        ProspectPageConfig.objects.create(user=instance)

# Update Match Bonus
@receiver(post_save, sender=MatchBonus)
def update_match_bonus(sender, instance, created, **kwargs):
    if created:
        subject = 'Match Bonus'
        message = f'You have received N{instance.credited_amount} for completing level {instance.user_depth}'
        UserNotification.objects.create(
            user=instance.user, subject=subject, message=message)
        user_account_info = UserAccountBalance.objects.get(user=instance.user)

        credited_amount = instance.credited_amount
        user_account_info.match_bonus_earned += credited_amount
        user_account_info.total_balance += credited_amount

        user_account_info.save()


# Update User Status
@receiver(post_save, sender=Payment)
def update_user_status(sender, instance, created, **kwargs):
    if not created and not instance.is_reg_bonus_credited:
        current_user = UserAccount.objects.get(email=instance.user.email)
        payment_status = instance.status
        user_account_info = UserAccountBalance.objects.get(user=instance.user)
        subject = 'Registration Bonus'
        message = 'You have received N2000 as registration bonus'

        if payment_status == 'Approved':
            current_user.status = 'Active'  # set user active
            user_account_info.total_balance += 2000  # credit reg bonus
            UserNotification.objects.create(
                user=instance.user, subject=subject, message=message)  # create notification
            # Add user to Active List
            ActiveUser.objects.create(user=instance.user)
            initialized_match_and_referral_bonus_payment()

            with transaction.atomic():
                current_user.save()
                user_account_info.save()
                instance.is_reg_bonus_credited = True  # set is_reg_bonus_credited True
                instance.save()


# Update Referral Bonus
@receiver(post_save, sender=ReferralBonus)
def update_referral_bonus(sender, instance, created, **kwargs):
    if created:
        user_account_info = UserAccountBalance.objects.get(user=instance.user)
        subject = 'Bono de Referencia - Black Diamond'
        message = f'Tu has recibido N{instance.credited_amount} por el usuario con codigo: {instance.referred_user_full_name}'
        UserNotification.objects.create(
            user=instance.user, subject=subject, message=message)

        credited_amount = instance.credited_amount
        user_account_info.referral_bonus_earned += credited_amount
        user_account_info.total_balance += credited_amount

        user_account_info.save()


# Withdrawal Approval
@receiver(post_save, sender=Withdrawal)
def approve_withdrawal(sender, instance, created, **kwargs):
    if not created and not instance.is_total_balance_updated:
        try:
            user_account_info = UserAccountBalance.objects.get(
                user=instance.user)
            withdrawal_amount = instance.amount

            if user_account_info.total_balance >= withdrawal_amount:

                if user_account_info.total_balance > instance.balance_before:
                    instance.balance_before = user_account_info.total_balance
                    instance.balance_after = user_account_info.total_balance - withdrawal_amount

                user_account_info.total_balance -= withdrawal_amount
                user_account_info.match_bonus_earned = 0
                user_account_info.referral_bonus_earned = 0

                with transaction.atomic():
                    user_account_info.save()
                    instance.is_total_balance_updated = True
                    instance.save()
            else:
                return

        except UserAccountBalance.DoesNotExist:
            # Handle the case where the UserAccountBalance doesn't exist for the user
            pass

@receiver(post_save, sender=UserAccount)
def handle_new_user_registration(sender, instance, created, **kwargs):
    """
    Signal que se ejecuta cuando se crea un nuevo usuario
    Lo marca como INACTIVO y notifica al superusuario
    """
    # Solo para usuarios NUEVOS (no actualizaciones)
    if not created:
        return
    
    # No procesar superusuarios
    if instance.is_superuser:
        return
   
    # Forzar usuario como INACTIVO (requiere aprobación)
    needs_update = False
    
    if instance.is_active:
        instance.is_active = False
        needs_update = True
    
    if instance.status != 'Inactive':
        instance.status = 'Inactive'
        needs_update = True
    
    # Generar código UUID si no tiene
    if not instance.code:
        instance.code = generate_ref_code()
        needs_update = True
    
    # Guardar cambios sin disparar el signal de nuevo
    if needs_update:
        UserAccount.objects.filter(pk=instance.pk).update(
            is_active=False,
            status='Inactive',
            code=instance.code
        )
   
    # Notificar al superusuario
    notify_superuser_about_new_user(instance)


def notify_superuser_about_new_user(user):
    """
    Envía email y notificación al superusuario sobre nuevo usuario pendiente
    """
    
    try:
        # Obtener superusuario
        super_user = UserAccount.objects.filter(is_superuser=True).first()
        
        if not super_user:
            return
        
        # Obtener info del referidor
        referrer_info = "Sin referidor"
        if user.refferer_code_used:
            try:
                referrer = UserAccount.objects.get(code=user.refferer_code_used)
                referrer_info = f"{referrer.first_name} {referrer.last_name} ({referrer.email})"
            except UserAccount.DoesNotExist:
                referrer_info = f"Código inválido: {user.refferer_code_used}"
        
        # URL del panel de administración
        admin_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        # Enviar email al superusuario
        send_mail(
            subject='🔔 Nuevo usuario Black Diamond pendiente de aprobación',
            message=f'''Hola Administrador de Black Diamond,

            Un nuevo usuario se ha registrado y está pendiente de aprobación:

            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            📋 INFORMACIÓN DEL USUARIO
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            Nombre: {user.first_name} {user.last_name}
            Email: {user.email}
            Teléfono: {user.phone_number or 'No proporcionado'}
            Referido por: {referrer_info}
            Código: {user.code}
            Fecha: {user.date_joined.strftime('%d/%m/%Y %H:%M')}

            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            Por favor, revisa y aprueba esta solicitud en:
            {admin_url}

            Saludos,
            Sistema Automático''',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[super_user.email],
            fail_silently=True,
        )
       
        # Crear notificación en el sistema
        UserNotification.objects.create(
            user=super_user,
            subject='Nuevo usuario pendiente',
            message=f'{user.first_name} {user.last_name} ({user.email}) se registró con el plan {user.plan}. Requiere aprobación.',
            is_read=False
        )

    except Exception as e:
        print(f"❌ Error enviando notificación: {e}")
        import traceback
        traceback.print_exc()
