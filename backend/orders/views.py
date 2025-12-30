from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from django.utils import timezone
import uuid
import logging
from .models import Order, OrderItem, OrderTracking
from .serializers import OrderSerializer
from products.models import ProductInteraction

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'payment_status']

    def get_queryset(self):
        if self.request.user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_from_cart(self, request):
        from carts.models import Cart

        try:
            cart = Cart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response(
                    {'error': 'Cart is empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create order
            order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            shipping_address = request.data.get('shipping_address', '')
            billing_address = request.data.get('billing_address', shipping_address)

            total_amount = cart.get_total()
            tax_amount = float(total_amount) * 0.1
            shipping_cost = 10.00

            order = Order.objects.create(
                user=request.user,
                order_number=order_number,
                total_amount=float(total_amount) + float(tax_amount) + float(shipping_cost),
                tax_amount=tax_amount,
                shipping_cost=shipping_cost,
                shipping_address=shipping_address,
                billing_address=billing_address,
            )

            # Create order items and track purchase interactions
            session_id = request.session.session_key
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price
                )
                
                # Track purchase interaction for each product
                try:
                    ProductInteraction.objects.create(
                        user=request.user,
                        product=cart_item.product,
                        interaction_type='purchase',
                        session_id=session_id
                    )
                    logger.info(f"Tracked purchase for user {request.user.id}, product {cart_item.product.id}")
                except Exception as e:
                    logger.error(f"Failed to track purchase interaction: {e}")

            # Create initial tracking
            OrderTracking.objects.create(
                order=order,
                status='pending',
                description='Order received'
            )

            # Clear cart
            cart.items.all().delete()

            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )

        except Cart.DoesNotExist:
            return Response(
                {'error': 'Cart not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in ['pending', 'processing']:
            return Response(
                {'error': 'Order cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'cancelled'
        order.save()
        OrderTracking.objects.create(
            order=order,
            status='cancelled',
            description='Order cancelled'
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def update_payment_status(self, request, pk=None):
        """
        Admin endpoint to update order payment status.
        Only superusers can update payment status.
        
        Request body:
        {
            "payment_status": "paid" | "failed",
            "notes": "Optional notes about payment"
        }
        """
        # Check if user is admin/superuser
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied. Only staff can update payment status.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        new_payment_status = request.data.get('payment_status')
        notes = request.data.get('notes', '')
        
        # Validate payment status
        valid_statuses = ['pending', 'paid', 'failed']
        if new_payment_status not in valid_statuses:
            return Response(
                {'error': f'Invalid payment status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_payment_status = order.payment_status
        
        # Update payment status
        order.payment_status = new_payment_status
        order.save()
        
        # If payment is now confirmed as paid, update order status
        if new_payment_status == 'paid' and order.status == 'pending':
            order.status = 'processing'
            order.save()
            OrderTracking.objects.create(
                order=order,
                status='processing',
                description='Payment confirmed. Order is now processing.'
            )
        
        # Track the payment status change as an interaction
        try:
            interaction_type_mapping = {
                'paid': 'payment_confirmed',
                'failed': 'payment_failed'
            }
            interaction_type = interaction_type_mapping.get(new_payment_status, 'payment_status_change')
            
            ProductInteraction.objects.create(
                user=order.user,
                product=None,  # Payment is order-level, not product-specific
                interaction_type=interaction_type,
                rating=None,
                session_id=f"order_{order.id}"
            )
            logger.info(f"Tracked payment status change for order {order.order_number}: {old_payment_status} → {new_payment_status}")
        except Exception as e:
            logger.error(f"Failed to track payment status change: {e}")
        
        return Response({
            'order_number': order.order_number,
            'old_payment_status': old_payment_status,
            'new_payment_status': new_payment_status,
            'order_status': order.status,
            'notes': notes,
            'message': f'Payment status updated from {old_payment_status} to {new_payment_status}'
        }, status=status.HTTP_200_OK)
