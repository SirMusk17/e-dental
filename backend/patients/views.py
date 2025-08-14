from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import Patient, AuditLog
from .serializers import (
    PatientSerializer, PatientCreateSerializer, PatientListSerializer,
    AuditLogSerializer, PatientSearchSerializer
)


class PatientViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des patients"""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'gdpr_consent', 'marketing_consent']
    search_fields = ['first_name', 'last_name', 'patient_number', 'phone', 'email']
    ordering_fields = ['created_at', 'last_name', 'first_name', 'birth_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Retourner le bon serializer selon l'action"""
        if self.action == 'create':
            return PatientCreateSerializer
        elif self.action == 'list':
            return PatientListSerializer
        return PatientSerializer
    
    def get_permissions(self):
        """Permissions personnalisées selon l'action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Seuls les dentistes, admins et secrétaires peuvent modifier
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """Créer un patient"""
        # Vérifier les permissions
        user_role = self.request.user.role
        if user_role not in ['DENTIST', 'ADMIN', 'SECRETARY']:
            raise PermissionDenied(
                "Seuls les dentistes, administrateurs et secrétaires peuvent créer des patients."
            )
        
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )
    
    def perform_update(self, serializer):
        """Mettre à jour un patient"""
        # Vérifier les permissions
        user_role = self.request.user.role
        if user_role not in ['DENTIST', 'ADMIN', 'SECRETARY']:
            raise permissions.PermissionDenied(
                "Seuls les dentistes, administrateurs et secrétaires peuvent modifier des patients."
            )
        
        serializer.save(updated_by=self.request.user)
    
    def perform_destroy(self, instance):
        """Supprimer un patient (soft delete)"""
        # Vérifier les permissions
        user_role = self.request.user.role
        if user_role not in ['DENTIST', 'ADMIN']:
            raise permissions.PermissionDenied(
                "Seuls les dentistes et administrateurs peuvent supprimer des patients."
            )
        
        # Soft delete - marquer comme inactif plutôt que supprimer
        # (Pour respecter les obligations RGPD de conservation)
        # instance.is_active = False
        # instance.save()
        
        # Pour l'instant, suppression réelle
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """Recherche avancée de patients"""
        serializer = PatientSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        queryset = self.get_queryset()
        data = serializer.validated_data
        
        # Filtrage par requête textuelle
        query = data.get('query')
        if query:
            queryset = queryset.filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(patient_number__icontains=query) |
                Q(phone__icontains=query) |
                Q(email__icontains=query)
            )
        
        # Filtrage par genre
        gender = data.get('gender')
        if gender:
            queryset = queryset.filter(gender=gender)
        
        # Filtrage par âge
        age_min = data.get('age_min')
        age_max = data.get('age_max')
        if age_min or age_max:
            today = timezone.now().date()
            if age_max:
                birth_date_min = today - timedelta(days=age_max * 365.25)
                queryset = queryset.filter(birth_date__gte=birth_date_min)
            if age_min:
                birth_date_max = today - timedelta(days=age_min * 365.25)
                queryset = queryset.filter(birth_date__lte=birth_date_max)
        
        # Filtrage par date de création
        created_after = data.get('created_after')
        created_before = data.get('created_before')
        if created_after:
            queryset = queryset.filter(created_at__date__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__date__lte=created_before)
        
        # Paginer les résultats
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PatientListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PatientListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def audit_log(self, request, pk=None):
        """Récupérer l'historique d'audit d'un patient"""
        patient = self.get_object()
        
        # Vérifier les permissions (seuls dentistes et admins)
        user_role = request.user.role
        if user_role not in ['DENTIST', 'ADMIN']:
            raise permissions.PermissionDenied(
                "Seuls les dentistes et administrateurs peuvent consulter l'historique d'audit."
            )
        
        logs = AuditLog.objects.filter(
            model_name='Patient',
            object_id=str(patient.id)
        ).order_by('-timestamp')
        
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = AuditLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Statistiques sur les patients"""
        # Vérifier les permissions
        user_role = request.user.role
        if user_role not in ['DENTIST', 'ADMIN']:
            raise permissions.PermissionDenied(
                "Seuls les dentistes et administrateurs peuvent consulter les statistiques."
            )
        
        queryset = self.get_queryset()
        
        # Statistiques de base
        total_patients = queryset.count()
        male_patients = queryset.filter(gender='M').count()
        female_patients = queryset.filter(gender='F').count()
        
        # Patients créés ce mois
        this_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = queryset.filter(created_at__gte=this_month).count()
        
        # Répartition par tranche d'âge
        today = timezone.now().date()
        age_ranges = {
            '0-18': queryset.filter(birth_date__gte=today - timedelta(days=18*365.25)).count(),
            '19-35': queryset.filter(
                birth_date__gte=today - timedelta(days=35*365.25),
                birth_date__lt=today - timedelta(days=18*365.25)
            ).count(),
            '36-55': queryset.filter(
                birth_date__gte=today - timedelta(days=55*365.25),
                birth_date__lt=today - timedelta(days=35*365.25)
            ).count(),
            '56+': queryset.filter(birth_date__lt=today - timedelta(days=55*365.25)).count(),
        }
        
        return Response({
            'total_patients': total_patients,
            'gender_distribution': {
                'male': male_patients,
                'female': female_patients
            },
            'new_this_month': new_this_month,
            'age_distribution': age_ranges
        })


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les logs d'audit (lecture seule)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'model_name', 'user']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def get_permissions(self):
        """Seuls les dentistes et admins peuvent consulter les logs"""
        permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtrer selon les permissions utilisateur"""
        user_role = self.request.user.role
        if user_role not in ['DENTIST', 'ADMIN']:
            # Les autres rôles ne voient que leurs propres actions
            return AuditLog.objects.filter(user=self.request.user)
        
        # Dentistes et admins voient tout
        return AuditLog.objects.all()
