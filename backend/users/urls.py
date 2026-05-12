from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileView, ChangePasswordView, SubscribeView,
    get_exclusions, add_exclusion, remove_exclusion,
)

urlpatterns = [
    path('login/',                              TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('token/refresh/',                      TokenRefreshView.as_view(),     name='token_refresh'),
    path('register/',                           RegisterView.as_view(),          name='auth_register'),
    path('me/',                                 ProfileView.as_view(),           name='user_profile'),
    path('me/password/',                        ChangePasswordView.as_view(),    name='change_password'),
    path('me/subscribe/',                       SubscribeView.as_view(),         name='subscribe'),
    path('me/exclusions/',                      get_exclusions,                  name='get_exclusions'),
    path('me/exclusions/add/',                  add_exclusion,                   name='add_exclusion'),
    path('me/exclusions/<int:ingredient_id>/',  remove_exclusion,                name='remove_exclusion'),
]