# dashboard/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Prospect, ProspectAction, UserAccount


def serialize_prospect(prospect):
    """Serializa un prospecto a dict según el modelo actual"""
    return {
        'id': str(prospect.id),
        'prospect_id': str(prospect.prospect_id) if prospect.prospect_id else None,
        'user_code': prospect.user_code,
        'first_name': prospect.first_name or '',
        'last_name': prospect.last_name or '',
        'email': prospect.email or '',
        'phone': prospect.phone or '',
        'country': prospect.country or '',
        'prospect_agent': prospect.prospect_agent or '',
        'created_at': prospect.created_at.isoformat() if prospect.created_at else None,
    }


def serialize_action(action):
    """Serializa una acción a dict - solo usa timestamp"""
    return {
        'id': action.id,
        'event_name': action.event_name,
        'details': action.details or {},
        'timestamp': action.timestamp.isoformat() if action.timestamp else None,
        'path': action.path or '',
        'session_id': action.session_id or '',
    }


class ProspectActionsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket Consumer para transmitir acciones de prospectos en tiempo real
    URL: ws://localhost:8000/ws/prospects/<user_code>/
    """
    
    async def connect(self):
        """Cuando el dashboard se conecta"""
        self.user_code = self.scope['url_route']['kwargs']['user_code']
        self.room_group_name = f'prospect_actions_{self.user_code}'
        
        # Verificar que el código existe
        user_exists = await self.verify_user_code(self.user_code)
        
        if not user_exists:
            await self.close(code=4004)
            return
        
        # Unirse al grupo de Channels
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Enviar datos iniciales
        await self.send_initial_data()
    
    async def disconnect(self, close_code):
        """Cuando el dashboard se desconecta"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Recibe mensajes del dashboard (ping/pong)"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'ping')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': str(timezone.now())
                }))
        except json.JSONDecodeError:
            pass
    
    async def send_initial_data(self):
        """Envía todos los prospectos al conectarse"""
        prospects = await self.get_prospects_with_actions()
        
        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'prospects': prospects,
            'timestamp': str(timezone.now())
        }))
    
    async def prospect_action_created(self, event):
        """Evento: nueva acción creada"""
        await self.send(text_data=json.dumps({
            'type': 'new_action',
            'action': event['action'],
            'prospect': event['prospect'],
            'timestamp': str(timezone.now())
        }))
    
    async def prospect_created(self, event):
        """Evento: nuevo prospecto creado"""
        await self.send(text_data=json.dumps({
            'type': 'new_prospect',
            'prospect': event['prospect'],
            'timestamp': str(timezone.now())
        }))
    
    @database_sync_to_async
    def verify_user_code(self, user_code):
        """Verifica si el código de usuario existe"""
        return UserAccount.objects.filter(code=user_code).exists()
    
    @database_sync_to_async
    def get_prospects_with_actions(self):
        """
        Obtiene prospectos con sus acciones
        """
        prospects = Prospect.objects.filter(
            user_code=self.user_code
        ).prefetch_related('prospect_action').order_by('-created_at')[:100]
        
        result = []
        for prospect in prospects:
            prospect_data = serialize_prospect(prospect)
            
            # Últimas 50 acciones - ordenadas por timestamp
            actions = prospect.prospect_action.all().order_by('-timestamp')[:50]
            prospect_data['actions'] = [serialize_action(a) for a in actions]
            prospect_data['total_actions'] = prospect.prospect_action.count()
            
            result.append(prospect_data)
        
        return result


class SingleProspectConsumer(AsyncWebsocketConsumer):
    """
    WebSocket para ver UN prospecto específico
    URL: ws://localhost:8000/ws/prospect/<prospect_id>/
    """
    
    async def connect(self):
        self.prospect_id = self.scope['url_route']['kwargs']['prospect_id']
        self.room_group_name = f'prospect_{self.prospect_id}'
        
        prospect_exists = await self.verify_prospect(self.prospect_id)
        
        if not prospect_exists:
            await self.close(code=4004)
            return
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        await self.send_initial_data()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def send_initial_data(self):
        """Envía los datos del prospecto"""
        data = await self.get_prospect_data()
        
        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'data': data,
            'timestamp': str(timezone.now())
        }))
    
    async def action_created(self, event):
        """Nueva acción para este prospecto"""
        await self.send(text_data=json.dumps({
            'type': 'new_action',
            'action': event['action'],
            'timestamp': str(timezone.now())
        }))
    
    @database_sync_to_async
    def verify_prospect(self, prospect_id):
        return Prospect.objects.filter(id=prospect_id).exists()
    
    @database_sync_to_async
    def get_prospect_data(self):
        """Obtiene datos del prospecto"""
        prospect = Prospect.objects.get(id=self.prospect_id)
        actions = prospect.prospect_action.all().order_by('-timestamp')
        
        return {
            'prospect': serialize_prospect(prospect),
            'actions': [serialize_action(a) for a in actions],
            'total_actions': actions.count()
        }