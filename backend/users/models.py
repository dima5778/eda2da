from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models

class User(AbstractUser):
    role = models.CharField(max_length=20, default='USER')
    is_subscriber = models.BooleanField(default=False)
    preferences = models.JSONField(default=list, blank=True)
    bio    = models.TextField(blank=True, default='')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)


class UserExclusion(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exclusions')
    ingredient = models.ForeignKey('recipes.Ingredient', on_delete=models.CASCADE)

    class Meta:
        unique_together = [('user', 'ingredient')]