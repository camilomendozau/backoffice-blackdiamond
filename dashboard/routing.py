# dashboard/routing.py

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Dashboard: Ver todos los prospectos de un usuario (user_code es UUID)
    re_path(
        r'ws/prospects/(?P<user_code>[0-9a-f-]+)/$', 
        consumers.ProspectActionsConsumer.as_asgi()
    ),
    
    # Dashboard: Ver un prospecto específico (prospect_id es UUID)
    re_path(
        r'ws/prospect/(?P<prospect_id>[0-9a-f-]+)/$', 
        consumers.SingleProspectConsumer.as_asgi()
    ),
]