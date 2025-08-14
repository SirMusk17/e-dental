from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Patient, AuditLog

User = get_user_model()


class PatientSerializer(serializers.ModelSerializer):
    """Serializer pour le modèle Patient"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'patient_number', 'first_name', 'last_name', 'birth_date',
            'age', 'gender', 'phone', 'mobile', 'email', 'address', 'postal_code', 'city',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'social_security_number', 'marital_status', 'profession',
            'allergies', 'medical_history', 'current_medications', 'medical_notes',
            'insurance_name', 'insurance_number',
            'rgpd_consent', 'rgpd_consent_date', 'marketing_consent',
            'created_at', 'updated_at', 'created_by', 'is_active',
            'created_by_username', 'updated_by_username'
        ]
        read_only_fields = [
            'id', 'patient_number', 'created_at', 'updated_at',
            'created_by', 'rgpd_consent_date', 'age'
        ]
    
    def get_age(self, obj):
        """Calculer l'âge du patient"""
        return obj.age
    
    def create(self, validated_data):
        """Créer un nouveau patient"""
        # L'utilisateur actuel sera défini dans la vue
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        
        return Patient.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        """Mettre à jour un patient"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la création de patients"""
    
    class Meta:
        model = Patient
        fields = [
            'first_name', 'last_name', 'birth_date', 'gender',
            'phone', 'mobile', 'email', 'address', 'postal_code', 'city',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            'rgpd_consent'
        ]
    
    def validate_rgpd_consent(self, value):
        """Valider que le consentement RGPD est donné"""
        if not value:
            raise serializers.ValidationError(
                "Le consentement RGPD est obligatoire pour créer un patient."
            )
        return value


class PatientListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des patients (champs limités)"""
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'patient_number', 'first_name', 'last_name',
            'birth_date', 'age', 'phone', 'email', 'created_at'
        ]
    
    def get_age(self, obj):
        """Calculer l'âge du patient"""
        return obj.age


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer pour les logs d'audit"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_username', 'action', 'model_name',
            'object_id', 'object_repr', 'changes', 'timestamp', 'ip_address'
        ]
        read_only_fields = ['id', 'timestamp']


class PatientSearchSerializer(serializers.Serializer):
    """Serializer pour la recherche de patients"""
    query = serializers.CharField(max_length=100, required=False)
    gender = serializers.ChoiceField(choices=Patient.GENDER_CHOICES, required=False)
    age_min = serializers.IntegerField(min_value=0, max_value=150, required=False)
    age_max = serializers.IntegerField(min_value=0, max_value=150, required=False)
    created_after = serializers.DateField(required=False)
    created_before = serializers.DateField(required=False)
    
    def validate(self, attrs):
        """Valider les paramètres de recherche"""
        age_min = attrs.get('age_min')
        age_max = attrs.get('age_max')
        
        if age_min and age_max and age_min > age_max:
            raise serializers.ValidationError(
                "L'âge minimum ne peut pas être supérieur à l'âge maximum."
            )
        
        created_after = attrs.get('created_after')
        created_before = attrs.get('created_before')
        
        if created_after and created_before and created_after > created_before:
            raise serializers.ValidationError(
                "La date de début ne peut pas être postérieure à la date de fin."
            )
        
        return attrs
