import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as TreatmentIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  monthlyRevenue: number;
  pendingTreatments: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    pendingTreatments: 0,
  });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques des patients
      const patientsResponse = await apiService.getPatients({ page: 1 });
      const totalPatients = patientsResponse.data.count;
      
      // Charger les patients récents (les 5 derniers)
      const recentPatientsResponse = await apiService.getPatients({ 
        page: 1, 
        ordering: '-created_at' 
      });
      
      setStats({
        totalPatients,
        todayAppointments: 8, // Mock data - à remplacer par vraies données
        monthlyRevenue: 15420, // Mock data
        pendingTreatments: 12, // Mock data
      });
      
      setRecentPatients(recentPatientsResponse.data.results.slice(0, 5));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'Utilisateur';
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'DENTIST': 'Dentiste',
      'SECRETARY': 'Secrétaire',
      'ASSISTANT': 'Assistant(e)',
      'ADMIN': 'Administrateur',
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'RDV Aujourd\'hui',
      value: stats.todayAppointments,
      icon: <CalendarIcon sx={{ fontSize: 40 }} />,
      color: '#26a69a',
      bgColor: '#e0f2f1',
    },
    {
      title: 'CA du Mois',
      value: `${stats.monthlyRevenue.toLocaleString('fr-FR')} €`,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: '#e8f5e8',
    },
    {
      title: 'Traitements en Cours',
      value: stats.pendingTreatments,
      icon: <TreatmentIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: '#fff3e0',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {getGreeting()}, {getUserDisplayName()}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {user?.role ? getRoleDisplayName(user.role) : 'Aucun rôle défini'}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.color}15 100%)`,
                border: `1px solid ${card.color}30`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ color: card.color, fontWeight: 'bold' }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, opacity: 0.7 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Patients Récents */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Patients Récents
              </Typography>
              <Button variant="outlined" size="small">
                Voir tout
              </Button>
            </Box>
            
            {recentPatients.length > 0 ? (
              <List>
                {recentPatients.map((patient, index) => (
                  <ListItem key={patient.id || index} divider>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${patient.first_name} ${patient.last_name}`}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption">
                            {formatDate(patient.created_at)}
                          </Typography>
                          <Chip
                            label={patient.gender === 'M' ? 'H' : patient.gender === 'F' ? 'F' : 'A'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Aucun patient récent
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Prochains RDV */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Prochains Rendez-vous
              </Typography>
              <Button variant="outlined" size="small">
                Agenda
              </Button>
            </Box>
            
            <List>
              {/* Mock data - à remplacer par vraies données */}
              <ListItem divider>
                <ListItemIcon>
                  <ScheduleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Marie Dubois"
                  secondary="09:00 - Consultation"
                />
              </ListItem>
              <ListItem divider>
                <ListItemIcon>
                  <ScheduleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Jean Martin"
                  secondary="10:30 - Détartrage"
                />
              </ListItem>
              <ListItem divider>
                <ListItemIcon>
                  <ScheduleIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Sophie Leroy"
                  secondary="14:00 - Soins"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
