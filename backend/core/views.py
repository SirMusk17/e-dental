from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import Client, Domain
from .serializers import (
    CustomUserSerializer, CustomUserCreateSerializer,
    ClientSerializer, DomainSerializer
)

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer JWT personnalisé avec informations utilisateur"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Ajouter des informations personnalisées au token
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vue JWT personnalisée"""
    serializer_class = CustomTokenObtainPairSerializer


class CustomUserViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des utilisateurs"""
    queryset = User.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Retourner le bon serializer selon l'action"""
        if self.action == 'create':
            return CustomUserCreateSerializer
        return CustomUserSerializer
    
    def get_permissions(self):
        """Permissions personnalisées selon l'action"""
        if self.action == 'create':
            # Seuls les admins peuvent créer des utilisateurs
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Seuls les admins ou l'utilisateur lui-même
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Créer un utilisateur"""
        # Vérifier que l'utilisateur actuel est admin
        if not (self.request.user.role == 'ADMIN' or self.request.user.is_superuser):
            raise permissions.PermissionDenied(
                "Seuls les administrateurs peuvent créer des utilisateurs."
            )
        serializer.save()
    
    def perform_update(self, serializer):
        """Mettre à jour un utilisateur"""
        # Vérifier les permissions
        user = self.get_object()
        if not (self.request.user == user or 
                self.request.user.role == 'ADMIN' or 
                self.request.user.is_superuser):
            raise permissions.PermissionDenied(
                "Vous ne pouvez modifier que votre propre profil."
            )
        serializer.save()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Récupérer le profil de l'utilisateur connecté"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Mettre à jour le profil de l'utilisateur connecté"""
        serializer = self.get_serializer(
            request.user, 
            data=request.data, 
            partial=request.method == 'PATCH'
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Changer le mot de passe de l'utilisateur connecté"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response(
                {'error': 'Ancien et nouveau mot de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Ancien mot de passe incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        
        return Response({'message': 'Mot de passe modifié avec succès.'})


class ClientViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les informations du cabinet (lecture seule)"""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourner seulement le client actuel"""
        # Dans un contexte multi-tenant, on récupère le tenant actuel
        from django_tenants.utils import get_tenant_model
        return get_tenant_model().objects.filter(schema_name=self.request.tenant.schema_name)


class DomainViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les domaines (lecture seule)"""
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Retourner seulement les domaines du tenant actuel"""
        return Domain.objects.filter(tenant=self.request.tenant)
