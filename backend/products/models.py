from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    GENDER_CHOICES = [
        ('M', 'Men'),
        ('W', 'Women'),
        ('U', 'Unisex'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='U')
    size = models.CharField(max_length=10, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    material = models.CharField(max_length=100, blank=True, null=True)
    rating = models.FloatField(default=0, help_text='Average rating from 0 to 5')
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to='products/')
    sku = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    title = models.CharField(max_length=255, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    
    class Meta:
        unique_together = ('product', 'user')

    def __str__(self):
        return f"{self.product.name} - {self.rating} stars"


class ProductInteraction(models.Model):
    """
    Telemetry/Tracking model for user interactions with products and orders.
    Used by the ML recommender system to learn from user behavior.
    Tracks: views, cart additions, purchases, ratings, payment events
    """
    INTERACTION_TYPES = [
        ('view', 'Page View'),
        ('add_to_cart', 'Added to Cart'),
        ('purchase', 'Purchase'),
        ('rate', 'Rated Product'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('payment_failed', 'Payment Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_interactions')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='interactions', null=True, blank=True)
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], blank=True, null=True)
    session_id = models.CharField(max_length=100, blank=True, null=True, help_text='For tracking user sessions or order IDs')
    time_spent_seconds = models.IntegerField(default=0, help_text='How long user viewed the product')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['product', 'interaction_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['interaction_type']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        product_name = self.product.name if self.product else 'Order-level'
        return f"{self.user.username} - {self.get_interaction_type_display()} - {product_name}"
    

