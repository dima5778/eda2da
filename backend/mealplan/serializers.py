from rest_framework import serializers
from .models import MealPlan, MealPlanRecipe

class MealPlanRecipeSerializer(serializers.ModelSerializer):
    recipe_title    = serializers.ReadOnlyField(source='recipe.title')
    recipe_image    = serializers.SerializerMethodField()
    recipe_calories = serializers.ReadOnlyField(source='recipe.calories')
    recipe_category = serializers.ReadOnlyField(source='recipe.category')

    class Meta:
        model = MealPlanRecipe
        fields = ['id', 'recipe', 'recipe_title', 'recipe_image', 'recipe_calories', 'recipe_category', 'date', 'meal_type']

    def get_recipe_image(self, obj):
        request = self.context.get('request')
        if obj.recipe.image and request:
            return request.build_absolute_uri(obj.recipe.image.url)
        return None

class MealPlanSerializer(serializers.ModelSerializer):
    recipes = MealPlanRecipeSerializer(many=True, read_only=True)

    class Meta:
        model = MealPlan
        fields = ['id', 'user', 'start_date', 'end_date', 'recipes']
        read_only_fields = ['user']
