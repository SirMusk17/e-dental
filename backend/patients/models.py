from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from cryptography.fernet import Fernet
import base64
import os

User = get_user_model()


# ============================================================================
# AUDIT ET TRAÇABILITÉ RGPD
# ============================================================================

class AuditLog(models.Model):
    """Modèle d'audit pour traçabilité RGPD"""
    ACTION_CHOICES = [
        ('CREATE', 'Création'),
        ('READ', 'Lecture'),
        ('UPDATE', 'Modification'),
        ('DELETE', 'Suppression'),
        ('LOGIN', 'Connexion'),
        ('LOGOUT', 'Déconnexion'),
        ('EXPORT', 'Export de données'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, verbose_name="Modèle concerné")
    object_id = models.CharField(max_length=100, blank=True, verbose_name="ID objet")
    object_repr = models.CharField(max_length=200, blank=True, verbose_name="Représentation objet")
    changes = models.JSONField(blank=True, null=True, verbose_name="Modifications")
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Log d'audit"
        verbose_name_plural = "Logs d'audit"
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name} - {self.timestamp}"


# ============================================================================
# CHIFFREMENT DES DONNÉES SENSIBLES
# ============================================================================

class EncryptedField(models.TextField):
    """Champ personnalisé pour chiffrer les données sensibles"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Générer ou récupérer la clé de chiffrement
        self.cipher_key = self._get_or_create_key()
    
    def _get_or_create_key(self):
        """Récupère ou crée la clé de chiffrement"""
        key_file = 'encryption.key'
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                key = f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
        return key
    
    def encrypt_value(self, value):
        """Chiffre une valeur"""
        if not value:
            return value
        f = Fernet(self.cipher_key)
        encrypted_value = f.encrypt(value.encode())
        return base64.urlsafe_b64encode(encrypted_value).decode()
    
    def decrypt_value(self, value):
        """Déchiffre une valeur"""
        if not value:
            return value
        try:
            f = Fernet(self.cipher_key)
            encrypted_value = base64.urlsafe_b64decode(value.encode())
            return f.decrypt(encrypted_value).decode()
        except:
            return value  # Retourne la valeur non chiffrée si erreur
    
    def from_db_value(self, value, expression, connection):
        """Déchiffre lors de la lecture depuis la DB"""
        return self.decrypt_value(value)
    
    def to_python(self, value):
        """Conversion Python"""
        return self.decrypt_value(value)
    
    def get_prep_value(self, value):
        """Chiffre avant sauvegarde en DB"""
        return self.encrypt_value(value)


# ============================================================================
# GESTION DES PATIENTS
# ============================================================================

class Patient(models.Model):
    """Modèle Patient avec données chiffrées"""
    GENDER_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
        ('O', 'Autre'),
    ]
    
    MARITAL_STATUS_CHOICES = [
        ('SINGLE', 'Célibataire'),
        ('MARRIED', 'Marié(e)'),
        ('DIVORCED', 'Divorcé(e)'),
        ('WIDOWED', 'Veuf/Veuve'),
    ]
    
    # Identité (données chiffrées)
    first_name = EncryptedField(verbose_name="Prénom")
    last_name = EncryptedField(verbose_name="Nom")
    birth_date = models.DateField(verbose_name="Date de naissance")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Sexe")
    
    # Informations personnelles
    social_security_number = EncryptedField(blank=True, verbose_name="Numéro de sécurité sociale")
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, verbose_name="Situation familiale")
    profession = models.CharField(max_length=100, blank=True, verbose_name="Profession")
    
    # Contact (données chiffrées)
    address = EncryptedField(blank=True, verbose_name="Adresse")
    postal_code = models.CharField(max_length=10, blank=True, verbose_name="Code postal")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ville")
    phone = EncryptedField(blank=True, verbose_name="Téléphone")
    mobile = EncryptedField(blank=True, verbose_name="Mobile")
    email = EncryptedField(blank=True, verbose_name="Email")
    
    # Contact d'urgence
    emergency_contact_name = EncryptedField(blank=True, verbose_name="Contact d'urgence - Nom")
    emergency_contact_phone = EncryptedField(blank=True, verbose_name="Contact d'urgence - Téléphone")
    emergency_contact_relation = models.CharField(max_length=50, blank=True, verbose_name="Lien de parenté")
    
    # Informations médicales
    allergies = models.TextField(blank=True, verbose_name="Allergies")
    medical_history = models.TextField(blank=True, verbose_name="Antécédents médicaux")
    current_medications = models.TextField(blank=True, verbose_name="Médicaments actuels")
    medical_notes = models.TextField(blank=True, verbose_name="Notes médicales")
    
    # Mutuelle et assurance
    insurance_name = models.CharField(max_length=100, blank=True, verbose_name="Nom mutuelle")
    insurance_number = EncryptedField(blank=True, verbose_name="Numéro adhérent")
    
    # Consentements RGPD
    rgpd_consent = models.BooleanField(default=False, verbose_name="Consentement RGPD")
    rgpd_consent_date = models.DateTimeField(null=True, blank=True, verbose_name="Date consentement RGPD")
    marketing_consent = models.BooleanField(default=False, verbose_name="Consentement marketing")
    
    # Métadonnées
    patient_number = models.CharField(max_length=20, unique=True, verbose_name="Numéro patient")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_patients')
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    class Meta:
        verbose_name = "Patient"
        verbose_name_plural = "Patients"
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.patient_number} - {self.last_name} {self.first_name}"
    
    def save(self, *args, **kwargs):
        # Générer un numéro patient si pas défini
        if not self.patient_number:
            last_patient = Patient.objects.order_by('-id').first()
            if last_patient:
                last_number = int(last_patient.patient_number.replace('P', ''))
                self.patient_number = f"P{last_number + 1:06d}"
            else:
                self.patient_number = "P000001"
        
        # Enregistrer la date de consentement RGPD
        if self.rgpd_consent and not self.rgpd_consent_date:
            self.rgpd_consent_date = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def age(self):
        """Calcule l'âge du patient"""
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
    
    @property
    def full_name(self):
        """Nom complet du patient"""
        return f"{self.first_name} {self.last_name}"
