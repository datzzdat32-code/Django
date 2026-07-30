from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/chat/', views.api_chat, name='api_chat'),
    path('api/clear/', views.api_clear, name='api_clear'),
]
