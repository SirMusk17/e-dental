from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Client, Domain

User = get_user_model()


class CustomUserSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle CustomUser"""
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'password', 'is_active', 'date_joined',
            # Informations professionnelles
            'license_number', 'speciality',
            # Paramètres de sécurité
            'last_password_change', 'failed_login_attempts', 'account_locked_until',
            # Paramètres d'interface
            'preferred_language'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'date_joined': {'read_only': True},
        }
    
    def create(self, validated_data):
        """Créer un nouvel utilisateur avec mot de passe hashé"""
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Mettre à jour un utilisateur"""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class CustomUserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'utilisateur (moins de champs)"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        """Valider que les mots de passe correspondent"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    
    def create(self, validated_data):
        """Créer un nouvel utilisateur"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ClientSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Client (Tenant)"""
    
    class Meta:
        model = Client
        fields = [
            'id', 'schema_name', 'name', 'created_on', 'address',
            'phone', 'email', 'siret', 'timezone', 'is_active',
            'default_appointment_duration', 'emergency_slots_per_day'
        ]
        read_only_fields = ['id', 'created_on', 'schema_name']


class DomainSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Domain"""
    
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'tenant', 'is_primary']
        read_only_fields = ['id']
