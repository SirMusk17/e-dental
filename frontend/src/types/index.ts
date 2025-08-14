// Types TypeScript pour l'application e-dental

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'DENTIST' | 'SECRETARY' | 'ASSISTANT' | 'ADMIN' | '';
  phone: string;
  is_active: boolean;
  date_joined: string;
  license_number: string;
  speciality: string;
  last_password_change: string;
  failed_login_attempts: number;
  account_locked_until: string | null;
  preferred_language: string;
}

export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F' | 'O';
  phone: string;
  mobile?: string;
  email: string;
  address?: string;
  postal_code?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  rgpd_consent: boolean;
  rgpd_consent_date?: string;
  marketing_consent?: boolean;
  patient_number?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Types pour les formulaires
export interface PatientFormData {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: 'M' | 'F' | 'O';
  phone: string;
  mobile?: string;
  email: string;
  address?: string;
  postal_code?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  rgpd_consent: boolean;
  marketing_consent?: boolean;
}

export interface LoginFormData {
  username: string;
  password: string;
}

// Types pour les erreurs API
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

export interface ValidationErrors {
  [key: string]: string[];
}
