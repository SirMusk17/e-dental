from django.db import models
from django.contrib.auth.models import AbstractUser
from django_tenants.models import TenantMixin, DomainMixin


# ============================================================================
# MODÈLES MULTI-TENANT
# ============================================================================

class Client(TenantMixin):
    """Modèle représentant un cabinet dentaire (tenant)"""
    name = models.CharField(max_length=100, verbose_name="Nom du cabinet")
    created_on = models.DateTimeField(auto_now_add=True)
    
    # Informations du cabinet
    address = models.TextField(blank=True, verbose_name="Adresse")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, verbose_name="Email")
    siret = models.CharField(max_length=14, blank=True, verbose_name="SIRET")
    
    # Configuration
    timezone = models.CharField(max_length=50, default='Europe/Paris', verbose_name="Fuseau horaire")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    
    # Paramètres métier
    default_appointment_duration = models.IntegerField(default=30, verbose_name="Durée RDV par défaut (min)")
    emergency_slots_per_day = models.IntegerField(default=2, verbose_name="Créneaux urgence/jour")
    
    auto_create_schema = True
    
    class Meta:
        verbose_name = "Cabinet dentaire"
        verbose_name_plural = "Cabinets dentaires"
    
    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """Domaine associé à un cabinet"""
    pass


# ============================================================================
# GESTION DES UTILISATEURS
# ============================================================================

class CustomUser(AbstractUser):
    """Utilisateur étendu pour le système médical"""
    ROLE_CHOICES = [
        ('DENTIST', 'Dentiste/Praticien'),
        ('SECRETARY', 'Secrétaire médicale'),
        ('ASSISTANT', 'Assistant(e) dentaire'),
        ('ADMIN', 'Administrateur cabinet'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name="Rôle")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    
    # Informations professionnelles
    license_number = models.CharField(max_length=50, blank=True, verbose_name="Numéro d'ordre/licence")
    speciality = models.CharField(max_length=100, blank=True, verbose_name="Spécialité")
    
    # Paramètres de sécurité
    last_password_change = models.DateTimeField(auto_now_add=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    
    # Paramètres d'interface
    preferred_language = models.CharField(max_length=10, default='fr', verbose_name="Langue préférée")
    
    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    @property
    def is_dentist(self):
        return self.role == 'DENTIST'
    
    @property
    def is_secretary(self):
        return self.role == 'SECRETARY'
    
    @property
    def is_assistant(self):
        return self.role == 'ASSISTANT'



