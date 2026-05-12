from django.db import models
from django.conf import settings
from recipes.models import Recipe, RecipeComposition
from django.db.models import Sum

class MealPlan(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"План {self.user.username} с {self.start_date}"

    def generate_shopping_list(self):
        """Собирает ингредиенты из всех рецептов плана, суммирует по единице измерения."""
        plan_recipes = MealPlanRecipe.objects.filter(plan=self)
        aggregated = {}  # (name, unit) -> quantity

        for item in plan_recipes:
            compositions = RecipeComposition.objects.filter(recipe=item.recipe).select_related('ingredient')
            for comp in compositions:
                key = (comp.ingredient.name, comp.ingredient.unit)
                aggregated[key] = aggregated.get(key, 0) + comp.quantity

        return [
            {'name': name, 'unit': unit, 'quantity': round(qty, 2)}
            for (name, unit), qty in sorted(aggregated.items())
        ]

class MealPlanRecipe(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = 'Breakfast', 'Завтрак'
        LUNCH = 'Lunch', 'Обед'
        DINNER = 'Dinner', 'Ужин'

    plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='recipes')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    date = models.DateField()
    meal_type = models.CharField(max_length=20, choices=MealType.choices)