import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Patient, PatientFormData } from '../../types';
import apiService from '../../services/api';

interface PatientFormProps {
  patient?: Patient | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({
  patient,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!patient;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PatientFormData>({
    defaultValues: {
      first_name: '',
      last_name: '',
      birth_date: '',
      gender: 'M',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      postal_code: '',
      city: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      rgpd_consent: false,
      marketing_consent: false,
    },
  });

  // Mutation pour créer/modifier un patient
  const mutation = useMutation({
    mutationFn: (data: PatientFormData) => {
      if (isEditing && patient?.id) {
        return apiService.updatePatient(patient.id, data);
      } else {
        return apiService.createPatient(data);
      }
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (patient) {
      reset({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        birth_date: patient.birth_date || '',
        gender: patient.gender || 'M',
        phone: patient.phone || '',
        mobile: patient.mobile || '',
        email: patient.email || '',
        address: patient.address || '',
        postal_code: patient.postal_code || '',
        city: patient.city || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        emergency_contact_relation: patient.emergency_contact_relation || '',
        rgpd_consent: patient.rgpd_consent || false,
        marketing_consent: patient.marketing_consent || false,
      });
    }
  }, [patient, reset]);

  const onSubmit = (data: PatientFormData) => {
    mutation.mutate(data);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
        {mutation.error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Erreur lors de la sauvegarde'}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Informations personnelles */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informations personnelles
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              {...register('first_name', {
                required: 'Le prénom est requis',
              })}
              fullWidth
              label="Prénom"
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              {...register('last_name', {
                required: 'Le nom est requis',
              })}
              fullWidth
              label="Nom"
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="birth_date"
              control={control}
              rules={{ required: 'La date de naissance est requise' }}
              render={({ field }) => (
                <DatePicker
                  label="Date de naissance"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date) => {
                    field.onChange(date ? date.format('YYYY-MM-DD') : '');
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.birth_date,
                      helperText: errors.birth_date?.message,
                      disabled: mutation.isPending,
                    },
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset" disabled={mutation.isPending}>
              <FormLabel component="legend">Genre</FormLabel>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    <FormControlLabel value="M" control={<Radio />} label="Homme" />
                    <FormControlLabel value="F" control={<Radio />} label="Femme" />
                    <FormControlLabel value="O" control={<Radio />} label="Autre" />
                  </RadioGroup>
                )}
              />
            </FormControl>
          </Grid>

          {/* Contact */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contact
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              {...register('phone', {
                required: 'Le téléphone est requis',
              })}
              fullWidth
              label="Téléphone"
              error={!!errors.phone}
              helperText={errors.phone?.message}
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              {...register('mobile')}
              fullWidth
              label="Mobile"
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              {...register('email', {
                required: 'L\'email est requis',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Format d\'email invalide',
                },
              })}
              fullWidth
              label="Email"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={mutation.isPending}
            />
          </Grid>

          {/* Adresse */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Adresse
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              {...register('address')}
              fullWidth
              label="Adresse"
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              {...register('postal_code')}
              fullWidth
              label="Code postal"
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              {...register('city')}
              fullWidth
              label="Ville"
              disabled={mutation.isPending}
            />
          </Grid>

          {/* Contact d'urgence */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contact d'urgence
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              {...register('emergency_contact_name')}
              fullWidth
              label="Nom du contact"
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              {...register('emergency_contact_phone')}
              fullWidth
              label="Téléphone du contact"
              disabled={mutation.isPending}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              {...register('emergency_contact_relation')}
              fullWidth
              label="Relation"
              disabled={mutation.isPending}
            />
          </Grid>

          {/* Consentements */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Consentements
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="rgpd_consent"
              control={control}
              rules={{ required: 'Le consentement RGPD est obligatoire' }}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      disabled={mutation.isPending}
                    />
                  }
                  label="J'accepte le traitement de mes données personnelles (RGPD) *"
                />
              )}
            />
            {errors.rgpd_consent && (
              <Typography variant="caption" color="error">
                {errors.rgpd_consent.message}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="marketing_consent"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      disabled={mutation.isPending}
                    />
                  }
                  label="J'accepte de recevoir des communications marketing"
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={onCancel} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {isEditing ? 'Modifier' : 'Créer'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default PatientForm;
