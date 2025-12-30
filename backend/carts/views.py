from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import ProductInteraction
import logging

logger = logging.getLogger(__name__)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        try:
            item, created = CartItem.objects.get_or_create(
                cart=cart, product_id=product_id,
                defaults={'quantity': quantity}
            )
            if not created:
                item.quantity += quantity
                item.save()
            
            # Track add-to-cart interaction
            try:
                session_id = request.session.session_key
                ProductInteraction.objects.create(
                    user=request.user,
                    product_id=product_id,
                    interaction_type='add_to_cart',
                    session_id=session_id
                )
                logger.info(f"Tracked add_to_cart for user {request.user.id}, product {product_id}")
            except Exception as e:
                logger.error(f"Failed to track add_to_cart interaction: {e}")
            
            return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        cart = Cart.objects.get(user=request.user)
        product_id = request.data.get('product_id')
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
