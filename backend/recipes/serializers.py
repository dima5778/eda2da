from rest_framework import serializers
from .models import Ingredient, Recipe, RecipeComposition, Review

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    username     = serializers.ReadOnlyField(source='user.username')
    recipe_title = serializers.ReadOnlyField(source='recipe.title')

    class Meta:
        model = Review
        fields = ['id', 'username', 'recipe_title', 'text', 'is_approved', 'created_at']
        read_only_fields = ['id', 'username', 'recipe_title', 'is_approved', 'created_at']


class RecipeCompositionSerializer(serializers.ModelSerializer):
    ingredient_id   = serializers.ReadOnlyField(source='ingredient.id')
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    unit            = serializers.ReadOnlyField(source='ingredient.unit')

    class Meta:
        model = RecipeComposition
        fields = ['ingredient_id', 'ingredient_name', 'quantity', 'unit']

class RecipeSerializer(serializers.ModelSerializer):
    ingredients  = RecipeCompositionSerializer(source='recipecomposition_set', many=True, read_only=True)
    author_name  = serializers.ReadOnlyField(source='author.username')
    image        = serializers.ImageField(required=False, allow_null=True)

    avg_rating    = serializers.SerializerMethodField()
    ratings_count = serializers.SerializerMethodField()
    user_rating   = serializers.SerializerMethodField()
    is_favorite   = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'instructions',
            'author_name', 'cooking_time', 'difficulty',
            'calories', 'protein', 'carbs', 'fat',
            'is_moderated', 'rejection_reason', 'ingredients', 'image',
            'category',
            'avg_rating', 'ratings_count', 'user_rating', 'is_favorite',
            'reviews',
        ]
        read_only_fields = ['id', 'author_name', 'is_moderated', 'rejection_reason']

    def get_avg_rating(self, obj):
        from django.db.models import Avg
        result = obj.ratings.aggregate(avg=Avg('score'))['avg']
        return round(result, 1) if result else None

    def get_ratings_count(self, obj):
        return obj.ratings.count()

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            r = obj.ratings.filter(user=request.user).first()
            return r.score if r else None
        return None

    def get_reviews(self, obj):
        request = self.context.get('request')
        is_admin = request and request.user.is_authenticated and request.user.is_staff
        qs = obj.reviews.all() if is_admin else obj.reviews.filter(is_approved=True)
        return ReviewSerializer(qs, many=True).data

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False
