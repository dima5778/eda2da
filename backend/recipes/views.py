from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Recipe, Ingredient, Favorite, Rating, RecipeComposition
from .serializers import RecipeSerializer, IngredientSerializer, ReviewSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()  # нужно для роутера
    serializer_class = RecipeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'ingredients__name']
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            qs = Recipe.objects.all().select_related('author')
        elif user.is_authenticated:
            qs = Recipe.objects.filter(
                Q(is_moderated=True) | Q(author=user)
            ).distinct()
        else:
            qs = Recipe.objects.filter(is_moderated=True)

        # Apply KBJU filters from query params
        cal_min  = self.request.query_params.get('cal_min')
        cal_max  = self.request.query_params.get('cal_max')
        prot_min = self.request.query_params.get('prot_min')
        fat_max  = self.request.query_params.get('fat_max')
        carbs_max= self.request.query_params.get('carbs_max')
        if cal_min:   qs = qs.filter(calories__gte=float(cal_min))
        if cal_max:   qs = qs.filter(calories__lte=float(cal_max))
        if prot_min:  qs = qs.filter(protein__gte=float(prot_min))
        if fat_max:   qs = qs.filter(fat__lte=float(fat_max))
        if carbs_max: qs = qs.filter(carbs__lte=float(carbs_max))

        # Exclude recipes containing user's excluded ingredients
        if user.is_authenticated:
            from users.models import UserExclusion
            excluded_ids = list(UserExclusion.objects.filter(user=user).values_list('ingredient_id', flat=True))
            if excluded_ids:
                qs = qs.exclude(ingredients__id__in=excluded_ids)

        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        # Лимит 50 рецептов для Free-пользователей
        if not user.is_staff and user.role not in ('pro', 'family'):
            count = Recipe.objects.filter(author=user).count()
            if count >= 50:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    'Free plan limit: 50 recipes. Upgrade to Pro for unlimited recipes.'
                )
        # Рецепты администратора одобряются автоматически, остальных — нет
        serializer.save(author=user, is_moderated=user.is_staff)

    def destroy(self, request, *args, **kwargs):
        recipe = self.get_object()
        if not (request.user.is_staff or recipe.author == request.user):
            return Response(
                {'detail': 'Нет прав для удаления.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Одобрить рецепт — только для администратора."""
        recipe = self.get_object()
        recipe.is_moderated = True
        recipe.save()
        return Response(RecipeSerializer(recipe, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def pending(self, request):
        """Рецепты на модерации — только для администратора."""
        qs = Recipe.objects.filter(is_moderated=False).select_related('author')
        return Response(RecipeSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def favorite(self, request, pk=None):
        """Toggle favorite status."""
        recipe = self.get_object()
        fav, created = Favorite.objects.get_or_create(user=request.user, recipe=recipe)
        if not created:
            fav.delete()
            return Response({'is_favorite': False})
        return Response({'is_favorite': True})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def rate(self, request, pk=None):
        """Rate recipe 1-5."""
        recipe = self.get_object()
        score = int(request.data.get('score', 0))
        if score < 1 or score > 5:
            return Response({'detail': 'Score must be 1-5'}, status=400)
        rating, _ = Rating.objects.update_or_create(
            user=request.user, recipe=recipe,
            defaults={'score': score}
        )
        serializer = RecipeSerializer(recipe, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticatedOrReadOnly])
    def reviews(self, request, pk=None):
        """List or create reviews for a recipe."""
        recipe = self.get_object()
        if request.method == 'GET':
            return Response(ReviewSerializer(recipe.reviews.all(), many=True).data)
        # POST
        s = ReviewSerializer(data=request.data)
        if s.is_valid():
            s.save(recipe=recipe, user=request.user)
            return Response(s.data, status=201)
        return Response(s.errors, status=400)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser], url_path='all_reviews')
    def all_reviews(self, request):
        """Список всех комментариев — только для администратора."""
        from .models import Review
        qs = Review.objects.select_related('user', 'recipe').order_by('-created_at')
        return Response(ReviewSerializer(qs, many=True).data)

    @action(detail=False, methods=['delete'], permission_classes=[IsAdminUser], url_path='reviews/(?P<review_id>[^/.]+)')
    def delete_review(self, request, review_id=None):
        """Удалить комментарий — только для администратора."""
        from .models import Review
        try:
            review = Review.objects.get(id=review_id)
            review.delete()
            return Response(status=204)
        except Review.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser], url_path='reviews/(?P<review_id>[^/.]+)/hide')
    def hide_review(self, request, review_id=None):
        """Скрыть комментарий (is_approved=False) — только для администратора."""
        from .models import Review
        try:
            review = Review.objects.get(id=review_id)
            review.is_approved = False
            review.save()
            return Response({'detail': 'hidden'})
        except Review.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser], url_path='reviews/(?P<review_id>[^/.]+)/approve')
    def approve_review(self, request, review_id=None):
        """Одобрить комментарий (is_approved=True) — только для администратора."""
        from .models import Review
        try:
            review = Review.objects.get(id=review_id)
            review.is_approved = True
            review.save()
            return Response({'detail': 'approved'})
        except Review.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a recipe with a reason."""
        recipe = self.get_object()
        reason = request.data.get('reason', '')
        recipe.is_moderated = False
        recipe.rejection_reason = reason
        recipe.save()
        return Response({'detail': 'rejected', 'reason': reason})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def recommendations(self, request):
        """Return up to 12 recommended recipes based on favorites and high ratings."""
        from django.db.models import Avg, Count
        user = request.user
        # Get IDs the user has favorited or rated 4+
        fav_ids = list(Favorite.objects.filter(user=user).values_list('recipe_id', flat=True))
        rated_ids = list(Rating.objects.filter(user=user, score__gte=4).values_list('recipe_id', flat=True))
        seed_ids = list(set(fav_ids + rated_ids))

        if not seed_ids:
            # Fallback: top rated recipes the user hasn't seen
            qs = Recipe.objects.filter(is_moderated=True).exclude(
                Q(favorited_by__user=user) | Q(ratings__user=user)
            ).annotate(avg_r=Avg('ratings__score'), cnt=Count('ratings__id')).filter(cnt__gte=1).order_by('-avg_r')[:12]
            return Response(RecipeSerializer(qs, many=True, context={'request': request}).data)

        # Find recipes that share ingredients with seed recipes, that user hasn't tried
        seed_ingredient_ids = list(
            RecipeComposition.objects.filter(recipe_id__in=seed_ids)
            .values_list('ingredient_id', flat=True).distinct()
        )
        already_seen = set(seed_ids) | set(Favorite.objects.filter(user=user).values_list('recipe_id', flat=True))

        recs = (
            Recipe.objects.filter(is_moderated=True)
            .exclude(id__in=already_seen)
            .annotate(shared=Count('recipecomposition__ingredient_id', filter=Q(recipecomposition__ingredient_id__in=seed_ingredient_ids)))
            .filter(shared__gte=1)
            .order_by('-shared')[:12]
        )
        if recs.count() < 6:
            # pad with popular
            extra = (
                Recipe.objects.filter(is_moderated=True)
                .exclude(id__in=already_seen)
                .exclude(id__in=[r.id for r in recs])
                .annotate(avg_r=Avg('ratings__score'))
                .order_by('-avg_r')[:12 - recs.count()]
            )
            combined = list(recs) + list(extra)
            return Response(RecipeSerializer(combined[:12], many=True, context={'request': request}).data)

        return Response(RecipeSerializer(recs, many=True, context={'request': request}).data)


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().order_by('name')
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
