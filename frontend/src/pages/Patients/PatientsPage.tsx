import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../../services/api';
import { Patient } from '../../types';
import PatientForm from '../../components/Patients/PatientForm';

const PatientsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPatient, setMenuPatient] = useState<Patient | null>(null);

  const queryClient = useQueryClient();

  // Query pour récupérer les patients
  const {
    data: patientsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['patients', currentPage, searchQuery],
    queryFn: () =>
      apiService.getPatients({
        page: currentPage,
        search: searchQuery || undefined,
        ordering: '-created_at',
      }),
  });

  // Mutation pour supprimer un patient
  const deletePatientMutation = useMutation({
    mutationFn: (patientId: number) => apiService.deletePatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
    handleMenuClose();
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (patientToDelete?.id) {
      deletePatientMutation.mutate(patientToDelete.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedPatient(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['patients'] });
    handleFormClose();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, patient: Patient) => {
    setAnchorEl(event.currentTarget);
    setMenuPatient(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuPatient(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getGenderLabel = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      'M': 'Homme',
      'F': 'Femme',
      'O': 'Autre',
    };
    return genderMap[gender] || gender;
  };

  const getGenderColor = (gender: string) => {
    const colorMap: { [key: string]: 'primary' | 'secondary' | 'default' } = {
      'M': 'primary',
      'F': 'secondary',
      'O': 'default',
    };
    return colorMap[gender] || 'default';
  };

  const patients = patientsData?.data.results || [];
  const totalPages = patientsData?.data.count ? Math.ceil(patientsData.data.count / 10) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Patients
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPatient}
          sx={{ borderRadius: 2 }}
        >
          Nouveau Patient
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un patient..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{ borderRadius: 2 }}
              >
                Filtres
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des patients
        </Alert>
      )}

      {/* Patients Grid */}
      <Grid container spacing={3}>
        {patients.map((patient) => (
          <Grid item xs={12} sm={6} md={4} key={patient.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" component="h3">
                      {patient.first_name} {patient.last_name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, patient)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={getGenderLabel(patient.gender)}
                    color={getGenderColor(patient.gender)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={formatDate(patient.birth_date)}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {patient.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {patient.phone}
                      </Typography>
                    </Box>
                  )}
                  {patient.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {patient.email}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    Créé le {formatDate(patient.created_at || '')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {!isLoading && patients.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Essayez de modifier votre recherche'
              : 'Commencez par ajouter votre premier patient'}
          </Typography>
          {!searchQuery && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPatient}>
              Ajouter un patient
            </Button>
          )}
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuPatient && handleEditPatient(menuPatient)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => menuPatient && handleDeletePatient(menuPatient)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Supprimer</ListItemText>
        </MenuItem>
      </Menu>

      {/* Patient Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPatient ? 'Modifier le patient' : 'Nouveau patient'}
        </DialogTitle>
        <DialogContent>
          <PatientForm
            patient={selectedPatient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le patient{' '}
            <strong>
              {patientToDelete?.first_name} {patientToDelete?.last_name}
            </strong>{' '}
            ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deletePatientMutation.isPending}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientsPage;
