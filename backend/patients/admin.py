from django.contrib import admin
from django.utils.html import format_html
from .models import Patient, AuditLog


# ============================================================================
# ADMINISTRATION PATIENTS
# ============================================================================

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['patient_number', 'full_name', 'birth_date', 'age', 'phone', 'is_active']
    list_filter = ['gender', 'is_active', 'created_at']
    search_fields = ['patient_number', 'first_name', 'last_name', 'phone']
    readonly_fields = ['patient_number', 'created_at', 'updated_at', 'age']
    
    fieldsets = (
        ('Identité', {
            'fields': ('patient_number', 'first_name', 'last_name', 'birth_date', 'gender')
        }),
        ('Contact', {
            'fields': ('phone', 'mobile', 'email', 'address', 'postal_code', 'city')
        }),
        ('Informations médicales', {
            'fields': ('allergies', 'medical_history', 'current_medications', 'medical_notes')
        }),
        ('RGPD & Consentements', {
            'fields': ('rgpd_consent', 'rgpd_consent_date', 'marketing_consent')
        }),
        ('Métadonnées', {
            'fields': ('created_at', 'updated_at', 'created_by', 'is_active'),
            'classes': ('collapse',)
        })
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'model_name', 'object_id']
    list_filter = ['action', 'model_name', 'timestamp']
    search_fields = ['user__username', 'model_name', 'object_id']
    readonly_fields = ['timestamp', 'user', 'action', 'model_name', 'object_id', 'changes']
    
    def has_add_permission(self, request):
        return False  # Les logs d'audit ne peuvent pas être créés manuellement
    
    def has_change_permission(self, request, obj=None):
        return False  # Les logs d'audit ne peuvent pas être modifiés
