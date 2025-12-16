from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
import uuid
from .models import Order, OrderItem, OrderTracking
from .serializers import OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'payment_status']

    def get_queryset(self):
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
            tax_amount = total_amount * 0.1
            shipping_cost = 10.00

            order = Order.objects.create(
                user=request.user,
                order_number=order_number,
                total_amount=total_amount + tax_amount + shipping_cost,
                tax_amount=tax_amount,
                shipping_cost=shipping_cost,
                shipping_address=shipping_address,
                billing_address=billing_address,
            )

            # Create order items
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price
                )

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
