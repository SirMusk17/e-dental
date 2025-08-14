import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { LocalHospital as DentalIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginFormData } from '../../types';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setIsLoading(true);
      
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #26a69a 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #26a69a)',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <DentalIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              e-Dental
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Gestion de Cabinet Dentaire
            </Typography>
          </Box>

          {/* Form */}
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom textAlign="center" mb={3}>
              Connexion
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                {...register('username', {
                  required: 'Le nom d\'utilisateur est requis',
                })}
                fullWidth
                label="Nom d'utilisateur"
                variant="outlined"
                margin="normal"
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
              />

              <TextField
                {...register('password', {
                  required: 'Le mot de passe est requis',
                  minLength: {
                    value: 6,
                    message: 'Le mot de passe doit contenir au moins 6 caractères',
                  },
                })}
                fullWidth
                label="Mot de passe"
                type="password"
                variant="outlined"
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={isLoading}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #1976d2, #26a69a)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1565c0, #00695c)',
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Se connecter'
                )}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Mot de passe oublié ? Contactez votre administrateur
              </Typography>
            </Box>
          </CardContent>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
            © 2025 e-Dental - Gestion de Cabinet Dentaire
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
