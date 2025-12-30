from django.contrib import admin
from .models import Product, Category, ProductInteraction, ProductReview

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'gender', 'stock', 'rating', 'is_active']
    list_filter = ['category', 'gender', 'is_active', 'created_at']
    search_fields = ['name', 'sku']
    readonly_fields = ['created_at', 'updated_at', 'rating']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'sku')
        }),
        ('Pricing', {
            'fields': ('price', 'cost_price')
        }),
        ('Product Details', {
            'fields': ('gender', 'size', 'color', 'material')
        }),
        ('Inventory', {
            'fields': ('stock', 'is_active')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Metadata', {
            'fields': ('rating', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:  # New object
            obj.sku = obj.sku or f"{obj.name.replace(' ', '-').lower()}-{obj.id or 'new'}"
        super().save_model(request, obj, form, change)

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['product__name', 'user__username']

@admin.register(ProductInteraction)
class ProductInteractionAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'interaction_type', 'created_at']
    list_filter = ['interaction_type', 'created_at']
    search_fields = ['product__name', 'user__username']