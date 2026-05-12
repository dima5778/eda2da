from django.db import models
from django.conf import settings

class Ingredient(models.Model):
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50) # г, мл, шт
    calories_per_100g = models.FloatField(default=0)
    is_allergen = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Recipe(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'Easy', 'Легко'
        MEDIUM = 'Medium', 'Средне'
        HARD = 'Hard', 'Сложно'

    CATEGORY_CHOICES = [
        ('soup',      'Суп'),
        ('main',      'Второе блюдо'),
        ('salad',     'Салат'),
        ('vegan',     'Веганское'),
        ('breakfast', 'Завтрак'),
        ('dessert',   'Десерт'),
        ('other',     'Другое'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    cooking_time = models.PositiveIntegerField(default=30) # в минутах
    difficulty = models.CharField(
        max_length=10, 
        choices=Difficulty.choices, 
        default=Difficulty.EASY
    )
    calories = models.FloatField(default=0)
    protein = models.FloatField(default=0)       # г белков
    carbs   = models.FloatField(default=0)       # г углеводов
    fat     = models.FloatField(default=0)       # г жиров
    instructions = models.TextField(blank=True, default='')  # пошаговое приготовление
    image        = models.ImageField(upload_to='recipes/', blank=True, null=True)
    is_moderated = models.BooleanField(default=False)  # требует одобрения администратора
    rejection_reason = models.TextField(blank=True, default='')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    ingredients = models.ManyToManyField(Ingredient, through='RecipeComposition')

    def __str__(self):
        return self.title

    def scale_ingredients(self, factor):
        compositions = RecipeComposition.objects.filter(recipe=self)
        scaled_data = []
        for item in compositions:
            scaled_data.append({
                'ingredient': item.ingredient.name,
                'quantity': item.quantity * factor,
                'unit': item.ingredient.unit
            })
        return scaled_data

class RecipeComposition(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.FloatField() # На одну порцию


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'recipe')


class Rating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ratings')
    score = models.PositiveSmallIntegerField()  # 1-5
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'recipe')


class Review(models.Model):
    recipe      = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='reviews')
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text        = models.TextField()
    is_approved = models.BooleanField(default=True)   # False = скрыт модератором
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = [('recipe', 'user')]