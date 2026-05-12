from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MealPlan
from .serializers import MealPlanSerializer, MealPlanRecipeSerializer

class MealPlanViewSet(viewsets.ModelViewSet):
    queryset = MealPlan.objects.all()
    serializer_class = MealPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        # Free-пользователи: только планы до 7 дней
        if not user.is_staff and user.role not in ('pro', 'family'):
            start = serializer.validated_data.get('start_date')
            end   = serializer.validated_data.get('end_date')
            if start and end and (end - start).days > 6:
                from rest_framework.exceptions import ValidationError
                raise ValidationError(
                    {'detail': 'FREE_PLAN_WEEK_LIMIT'}
                )
        serializer.save(user=user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def shopping_list(self, request, pk=None):
        """Эндпоинт для получения суммарного списка продуктов"""
        plan = self.get_object()
        data = plan.generate_shopping_list()
        return Response(data)

    @action(detail=True, methods=['post'])
    def add_recipe(self, request, pk=None):
        """Add a recipe slot to the plan."""
        plan = self.get_object()
        recipe_id = request.data.get('recipe_id')
        date      = request.data.get('date')
        meal_type = request.data.get('meal_type')

        if not all([recipe_id, date, meal_type]):
            return Response({'detail': 'recipe_id, date, meal_type required'}, status=400)

        from recipes.models import Recipe
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except Recipe.DoesNotExist:
            return Response({'detail': 'Recipe not found'}, status=404)

        from .models import MealPlanRecipe
        slot = MealPlanRecipe.objects.create(plan=plan, recipe=recipe, date=date, meal_type=meal_type)
        serializer = MealPlanRecipeSerializer(slot, context={'request': request})
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['delete'], url_path='remove_recipe/(?P<slot_id>[^/.]+)')
    def remove_recipe(self, request, pk=None, slot_id=None):
        """Remove a recipe slot from the plan."""
        plan = self.get_object()
        from .models import MealPlanRecipe
        try:
            slot = MealPlanRecipe.objects.get(id=slot_id, plan=plan)
            slot.delete()
            return Response(status=204)
        except MealPlanRecipe.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
