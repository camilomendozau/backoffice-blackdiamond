from django.urls import path
from .views import *

urlpatterns = [
    path('payments', PaymentView.as_view()),
    # path('payments/<int:id>', PaymentViewRetrieveUpdateDestroyView.as_view()),
    path('check-refcode/<str:code>', RefCodeCheckView.as_view()),
    path('downlines', DownlineView.as_view()),
    path('refferals', RefferalView.as_view()),
    path('withdrawals', WithdrawalView.as_view()),
    path('user-account-info', UserAccountInfoView.as_view()),
    path('user-notifications', UserNotificationView.as_view()),
    path('level-information', LevelInformationView.as_view()),
    path('prospect-actions', ProspectActionView.as_view()),
    path('prospects/', ProspectListView.as_view(), name='prospect-list'),
    path('prospect/<uuid:prospect_id>/', ProspectDetailView.as_view(), name='prospect-detail'),
    path('prospect-check/', ProspectCheckView.as_view(), name='prospect-check'),
]
