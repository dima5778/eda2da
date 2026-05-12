from rest_framework import serializers
from .models import User

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    avatar                  = serializers.ImageField(required=False, allow_null=True)
    recipes_count           = serializers.SerializerMethodField()
    favorites_count         = serializers.SerializerMethodField()
    ratings_count           = serializers.SerializerMethodField()
    excluded_ingredient_ids = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_subscriber', 'is_staff',
            'bio', 'avatar',
            'recipes_count', 'favorites_count', 'ratings_count',
            'excluded_ingredient_ids',
            'date_joined',
        ]
        read_only_fields = ['id', 'username', 'is_staff', 'is_subscriber', 'role', 'date_joined']

    def get_recipes_count(self, obj):
        return obj.recipe_set.count()

    def get_favorites_count(self, obj):
        return obj.favorites.count()

    def get_ratings_count(self, obj):
        return obj.ratings.count()

    def get_excluded_ingredient_ids(self, obj):
        from .models import UserExclusion
        return list(UserExclusion.objects.filter(user=obj).values_list('ingredient_id', flat=True))

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)
