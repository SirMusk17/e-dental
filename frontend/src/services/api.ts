import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthTokens, User, Patient, LoginCredentials, PaginatedResponse } from '../types';

// Configuration de base pour Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer le refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.data.access);
              
              // Retry la requête originale avec le nouveau token
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Si le refresh échoue, rediriger vers login
            this.logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentification
  async login(credentials: LoginCredentials): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/login/', credentials);
  }

  async refreshToken(refresh: string): Promise<AxiosResponse<{ access: string }>> {
    return this.api.post('/auth/refresh/', { refresh });
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Utilisateurs
  async getCurrentUser(): Promise<AxiosResponse<User>> {
    return this.api.get('/api/users/me/');
  }

  // Patients
  async getPatients(params?: {
    page?: number;
    search?: string;
    gender?: string;
    rgpd_consent?: boolean;
    ordering?: string;
  }): Promise<AxiosResponse<PaginatedResponse<Patient>>> {
    return this.api.get('/api/patients/', { params });
  }

  async getPatient(id: number): Promise<AxiosResponse<Patient>> {
    return this.api.get(`/api/patients/${id}/`);
  }

  async createPatient(patient: Partial<Patient>): Promise<AxiosResponse<Patient>> {
    return this.api.post('/api/patients/', patient);
  }

  async updatePatient(id: number, patient: Partial<Patient>): Promise<AxiosResponse<Patient>> {
    return this.api.put(`/api/patients/${id}/`, patient);
  }

  async deletePatient(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/api/patients/${id}/`);
  }

  async searchPatients(query: string): Promise<AxiosResponse<Patient[]>> {
    return this.api.get('/api/patients/search/', { params: { q: query } });
  }

  async getPatientsStatistics(): Promise<AxiosResponse<any>> {
    return this.api.get('/api/patients/statistics/');
  }

  // Helper methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService;
