from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import Client, Domain, CustomUser


# ============================================================================
# ADMINISTRATION MULTI-TENANT
# ============================================================================

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Administration des cabinets dentaires"""
    list_display = ('name', 'created_on', 'is_active', 'phone', 'email')
    list_filter = ('is_active', 'created_on')
    search_fields = ('name', 'email', 'phone')
    readonly_fields = ('created_on', 'schema_name')
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'schema_name', 'created_on', 'is_active')
        }),
        ('Contact', {
            'fields': ('address', 'phone', 'email', 'siret')
        }),
        ('Configuration', {
            'fields': ('timezone', 'default_appointment_duration', 'emergency_slots_per_day')
        }),
    )


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    """Administration des domaines"""
    list_display = ('domain', 'tenant', 'is_primary')
    list_filter = ('is_primary',)
    search_fields = ('domain',)


# ============================================================================
# ADMINISTRATION DES UTILISATEURS
# ============================================================================

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Administration des utilisateurs médicaux"""
    list_display = ('username', 'get_full_name', 'role', 'email', 'is_active', 'last_login')
    list_filter = ('role', 'is_active', 'is_staff', 'last_login')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informations médicales', {
            'fields': ('role', 'phone', 'license_number', 'speciality')
        }),
        ('Sécurité', {
            'fields': ('last_password_change', 'failed_login_attempts', 'account_locked_until')
        }),
        ('Préférences', {
            'fields': ('preferred_language',)
        }),
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username
    get_full_name.short_description = 'Nom complet'



