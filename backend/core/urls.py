from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    CustomUserViewSet,
    ClientViewSet,
    DomainViewSet
)

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'users', CustomUserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'domains', DomainViewSet)

urlpatterns = [
    # Authentification JWT
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # APIs REST
    path('api/', include(router.urls)),
]
