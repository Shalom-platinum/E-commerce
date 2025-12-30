from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import admin_views

router = DefaultRouter()
router.register(r'', views.OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    
    # Admin payment management endpoints
    path('admin/dashboard/stats/', admin_views.payment_dashboard_stats, name='payment_dashboard_stats'),
    path('admin/pending/', admin_views.pending_orders_list, name='pending_orders_list'),
    path('admin/order/<int:order_id>/', admin_views.order_details, name='order_details'),
    path('admin/analytics/', admin_views.payment_analytics, name='payment_analytics'),
]
