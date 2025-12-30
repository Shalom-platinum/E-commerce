from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from orders.models import Order, OrderItem, OrderTracking
from products.models import ProductInteraction
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class AdminPaymentDashboardView(TemplateView):
    """
    Admin dashboard for managing order payments.
    """
    template_name = 'admin/payment_dashboard.html'
    permission_classes = [IsAdminUser]


@api_view(['GET'])
@permission_classes([IsAdminUser])
def payment_dashboard_stats(request):
    """
    Get statistics for the payment dashboard.
    
    Returns:
    - Total pending payments
    - Total paid orders
    - Failed payments
    - Payment statistics
    """
    try:
        # Get orders statistics
        pending_orders = Order.objects.filter(payment_status='pending')
        paid_orders = Order.objects.filter(payment_status='paid')
        failed_orders = Order.objects.filter(payment_status='failed')
        
        # Calculate totals
        pending_amount = pending_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        paid_amount = paid_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        failed_amount = failed_orders.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Get recent payment changes
        recent_days = 30
        date_threshold = timezone.now() - timedelta(days=recent_days)
        
        payment_changes = ProductInteraction.objects.filter(
            interaction_type__in=['payment_confirmed', 'payment_failed'],
            created_at__gte=date_threshold
        ).values('interaction_type').annotate(count=Count('id'))
        
        # Convert to dict
        payment_change_dict = {}
        for change in payment_changes:
            payment_change_dict[change['interaction_type']] = change['count']
        
        stats = {
            'pending': {
                'count': pending_orders.count(),
                'amount': float(pending_amount)
            },
            'paid': {
                'count': paid_orders.count(),
                'amount': float(paid_amount)
            },
            'failed': {
                'count': failed_orders.count(),
                'amount': float(failed_amount)
            },
            'payment_changes_last_30_days': payment_change_dict,
            'total_revenue': float(paid_amount),
            'timestamp': timezone.now().isoformat()
        }
        
        return Response(stats)
    
    except Exception as e:
        logger.error(f"Error fetching payment dashboard stats: {e}")
        return Response(
            {'error': 'Failed to fetch dashboard statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pending_orders_list(request):
    """
    Get list of all pending payment orders.
    
    Query parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20)
    - status: Filter by order status (pending, processing, shipped, delivered)
    """
    try:
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        order_status = request.query_params.get('status', None)
        
        # Base queryset: all pending payments
        queryset = Order.objects.filter(payment_status='pending').order_by('-created_at')
        
        # Optional status filter
        if order_status:
            queryset = queryset.filter(status=order_status)
        
        # Pagination
        total_count = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        orders = queryset[start:end]
        
        # Serialize orders
        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user': order.user.get_full_name() or order.user.username,
                'user_email': order.user.email,
                'total_amount': float(order.total_amount),
                'status': order.status,
                'payment_status': order.payment_status,
                'created_at': order.created_at.isoformat(),
                'items_count': order.items.count()
            })
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': orders_data
        })
    
    except Exception as e:
        logger.error(f"Error fetching pending orders: {e}")
        return Response(
            {'error': 'Failed to fetch pending orders'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_details(request, order_id):
    """
    Get detailed information about a specific order including items.
    """
    try:
        order = Order.objects.get(id=order_id)
        
        # Get order items
        items = order.items.all()
        items_data = [
            {
                'id': item.id,
                'product_id': item.product.id,
                'product_name': item.product.name,
                'quantity': item.quantity,
                'price': float(item.price),
                'subtotal': float(item.price * item.quantity),
                'created_at': item.created_at.isoformat()
            }
            for item in items
        ]
        
        # Get tracking history
        tracking = order.tracking.all()
        tracking_data = [
            {
                'status': t.status,
                'description': t.description,
                'created_at': t.created_at.isoformat()
            }
            for t in tracking
        ]
        
        # Get payment interactions
        payment_interactions = ProductInteraction.objects.filter(
            user=order.user,
            session_id=f"order_{order.id}",
            interaction_type__in=['payment_confirmed', 'payment_failed']
        )
        
        payment_events = [
            {
                'type': pi.interaction_type,
                'created_at': pi.created_at.isoformat()
            }
            for pi in payment_interactions
        ]
        
        return Response({
            'id': order.id,
            'order_number': order.order_number,
            'user': {
                'id': order.user.id,
                'username': order.user.username,
                'email': order.user.email,
                'full_name': order.user.get_full_name()
            },
            'status': order.status,
            'payment_status': order.payment_status,
            'total_amount': float(order.total_amount),
            'tax_amount': float(order.tax_amount),
            'shipping_cost': float(order.shipping_cost),
            'shipping_address': order.shipping_address,
            'billing_address': order.billing_address,
            'notes': order.notes,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat(),
            'items': items_data,
            'tracking': tracking_data,
            'payment_events': payment_events
        })
    
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error fetching order details: {e}")
        return Response(
            {'error': 'Failed to fetch order details'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def payment_analytics(request):
    """
    Get advanced payment analytics.
    
    Returns:
    - Daily payment confirmations/failures
    - Payment status distribution
    - Top customers by revenue
    - Payment success rate
    """
    try:
        # Payment status distribution
        status_distribution = Order.objects.values('payment_status').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        )
        
        # Convert to dict
        status_dist_dict = {}
        for item in status_distribution:
            status_dist_dict[item['payment_status']] = {
                'count': item['count'],
                'amount': float(item['total'] or 0)
            }
        
        # Get last 30 days of payment interactions
        recent_days = 30
        date_threshold = timezone.now() - timedelta(days=recent_days)
        
        daily_payments = ProductInteraction.objects.filter(
            interaction_type__in=['payment_confirmed', 'payment_failed'],
            created_at__gte=date_threshold
        ).extra(
            select={'date': 'DATE(created_at)'}
        ).values('date', 'interaction_type').annotate(count=Count('id')).order_by('date')
        
        # Format daily data
        daily_data = {}
        for item in daily_payments:
            date_str = str(item['date'])
            if date_str not in daily_data:
                daily_data[date_str] = {'confirmed': 0, 'failed': 0}
            
            if item['interaction_type'] == 'payment_confirmed':
                daily_data[date_str]['confirmed'] = item['count']
            elif item['interaction_type'] == 'payment_failed':
                daily_data[date_str]['failed'] = item['count']
        
        # Calculate success rate
        total_payment_events = ProductInteraction.objects.filter(
            interaction_type__in=['payment_confirmed', 'payment_failed'],
            created_at__gte=date_threshold
        ).count()
        
        confirmed_count = ProductInteraction.objects.filter(
            interaction_type='payment_confirmed',
            created_at__gte=date_threshold
        ).count()
        
        success_rate = (confirmed_count / total_payment_events * 100) if total_payment_events > 0 else 0
        
        return Response({
            'status_distribution': status_dist_dict,
            'daily_payment_data': daily_data,
            'success_rate': round(success_rate, 2),
            'total_payment_events': total_payment_events,
            'period_days': recent_days
        })
    
    except Exception as e:
        logger.error(f"Error fetching payment analytics: {e}")
        return Response(
            {'error': 'Failed to fetch analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
