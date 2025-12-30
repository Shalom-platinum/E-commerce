from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch, F, Count, Avg
from django.utils import timezone
from datetime import timedelta
import json
from .models import Product, Category, ProductReview, ProductInteraction
from .serializers import ProductSerializer, CategorySerializer, ProductListSerializer, ProductReviewSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    print('CategoryViewSet initialized  ')
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'gender', 'size', 'color', 'price']
    search_fields = ['name', 'description', 'material']
    ordering_fields = ['price', 'rating', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        # Show only active products for non-staff users
        if self.request.user.is_staff:
            return Product.objects.all()
        return Product.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to track product views.
        Every time a product is viewed, log it as a ProductInteraction.
        """
        product = self.get_object()
        
        # Track the view interaction if user is authenticated
        if request.user.is_authenticated:
            session_id = request.session.session_key
            ProductInteraction.objects.create(
                user=request.user,
                product=product,
                interaction_type='view',
                session_id=session_id
            )
        
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        product = self.get_object()
        reviews = product.reviews.all()
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_review(self, request, pk=None):
        product = self.get_object()
        serializer = ProductReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(product=product, user=request.user)
            
            # Track the rating interaction
            if request.user.is_authenticated:
                ProductInteraction.objects.create(
                    user=request.user,
                    product=product,
                    interaction_type='rate',
                    rating=review.rating
                )
            
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    @action(detail=False, methods=['get'], permission_classes=[])
    def training_data(self, request):
        """
        Export training data for ML recommender system.
        Returns aggregated product features and user interaction history.
        Query params:
        - days: Number of recent days to include (default: 90)
        - format: 'json' or 'csv' (default: 'json')
        """
        days = int(request.query_params.get('days', 90))
        date_threshold = timezone.now() - timedelta(days=days)

        # Get all products with aggregated ratings
        products = Product.objects.filter(is_active=True).annotate(
            avg_rating=Avg('reviews__rating'),
            review_count=Count('reviews'),
            interaction_count=Count('interactions')
        ).values(
            'id', 'name', 'description', 'category__name', 'price',
            'gender', 'color', 'material', 'size', 'stock',
            'avg_rating', 'review_count', 'interaction_count'
        )

        # Get user interactions
        interactions = ProductInteraction.objects.filter(
            created_at__gte=date_threshold
        ).values(
            'user_id', 'product_id', 'interaction_type', 'rating', 'created_at'
        ).order_by('user_id', '-created_at')

        # Format response for ML training
        training_data = {
            'products': list(products),
            'interactions': list(interactions),
            'metadata': {
                'total_products': products.count(),
                'total_interactions': interactions.count(),
                'date_range_days': days,
                'generated_at': timezone.now().isoformat()
            }
        }

        response_format = request.query_params.get('format', 'json')
        if response_format == 'csv':
            # Return as downloadable CSV (optional)
            import csv
            from django.http import HttpResponse
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="training_data.csv"'
            # CSV conversion logic here
            return response

        return Response(training_data)
