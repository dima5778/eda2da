from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from .serializers import UserRegisterSerializer, UserSerializer, ChangePasswordSerializer
from .models import User, UserExclusion

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegisterSerializer

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Неверный текущий пароль.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Пароль успешно изменён.'})

class SubscribeView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        plan = request.data.get('plan', 'free')
        if plan not in ('free', 'pro', 'family'):
            return Response({'detail': 'Invalid plan.'}, status=400)
        user = request.user
        user.role = plan
        user.is_subscriber = (plan != 'free')
        user.save(update_fields=['role', 'is_subscriber'])
        from .serializers import UserSerializer
        return Response(UserSerializer(user, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exclusions(request):
    from recipes.serializers import IngredientSerializer
    excl = UserExclusion.objects.filter(user=request.user).select_related('ingredient')
    return Response(IngredientSerializer([e.ingredient for e in excl], many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_exclusion(request):
    ingredient_id = request.data.get('ingredient_id')
    if not ingredient_id:
        return Response({'detail': 'ingredient_id required'}, status=400)
    from recipes.models import Ingredient
    try:
        ing = Ingredient.objects.get(id=ingredient_id)
    except Ingredient.DoesNotExist:
        return Response({'detail': 'Not found'}, status=404)
    UserExclusion.objects.get_or_create(user=request.user, ingredient=ing)
    return Response({'detail': 'added'}, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_exclusion(request, ingredient_id):
    UserExclusion.objects.filter(user=request.user, ingredient_id=ingredient_id).delete()
    return Response(status=204)
