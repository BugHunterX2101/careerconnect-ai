import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Avatar, Grid, Chip, Divider, CircularProgress, Alert, List, ListItem, ListItemText
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Work, School, ContactMail, ArrowBack, LocationOn,
  Email, Phone, Language, LinkedIn, GitHub, Star
} from '@mui/icons-material';
import { employerService } from '../../services/employerService';

const CandidateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const data = await employerService.getCandidateById(id);
        setCandidate(data?.candidate || data?.data || data);
      } catch (err) {
        setError('Could not load candidate profile.');
        console.error('Candidate details error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id]);

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    return [location.city, location.state, location.country].filter(Boolean).join(', ');
  };

  const handleContactChat = () => {
    navigate(`/chat?user=${id}`);
  };

  const handleRateCandidate = async () => {
    try {
      setInviting(true);
      await employerService.rateCandidateForJob(id, null);
      setInviteSuccess('Candidate shortlisted!');
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err) {
      console.error('Rate error:', err);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Candidate Profile
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {inviteSuccess && <Alert severity="success" sx={{ mb: 3 }}>{inviteSuccess}</Alert>}

      {!candidate && !loading ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">Candidate not found.</Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/employer/candidates/search')}>
              Back to Search
            </Button>
          </CardContent>
        </Card>
      ) : candidate && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  src={candidate.profile?.avatar}
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
                >
                  {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {candidate.firstName} {candidate.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {candidate.profile?.title || candidate.currentRole || 'Professional'}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3, textAlign: 'left' }}>
                  {candidate.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{candidate.email}</Typography>
                    </Box>
                  )}
                  {(candidate.profile?.phone || candidate.phone) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">{candidate.profile?.phone || candidate.phone}</Typography>
                    </Box>
                  )}
                  {(candidate.profile?.location || candidate.location) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{formatLocation(candidate.profile?.location || candidate.location)}</Typography>
                    </Box>
                  )}
                </Box>

                <Button fullWidth variant="contained" startIcon={<ContactMail />} onClick={handleContactChat} sx={{ mb: 1 }}>
                  Send Message
                </Button>
                <Button fullWidth variant="outlined" startIcon={<Star />} onClick={handleRateCandidate} disabled={inviting}>
                  {inviting ? 'Saving...' : 'Shortlist'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {(candidate.profile?.summary || candidate.bio) && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Summary</Typography>
                  <Typography variant="body1">{candidate.profile?.summary || candidate.bio}</Typography>
                </CardContent>
              </Card>
            )}

            {(candidate.profile?.skills || candidate.skills)?.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Skills</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(candidate.profile?.skills || candidate.skills).map((skill, i) => (
                      <Chip key={i} label={skill} variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {(candidate.profile?.experience || candidate.experience)?.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Work fontSize="small" /> Experience
                  </Typography>
                  <List dense>
                    {(candidate.profile?.experience || candidate.experience).map((exp, i) => (
                      <ListItem key={i} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{exp.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.company} • {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                        </Typography>
                        {exp.description && <Typography variant="body2" sx={{ mt: 0.5 }}>{exp.description}</Typography>}
                        {i < (candidate.profile?.experience || candidate.experience).length - 1 && <Divider sx={{ width: '100%', mt: 1.5 }} />}
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {(candidate.profile?.education || candidate.education)?.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" /> Education
                  </Typography>
                  <List dense>
                    {(candidate.profile?.education || candidate.education).map((edu, i) => (
                      <ListItem key={i} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{edu.degree} in {edu.field || edu.major}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {edu.institution || edu.school} • {edu.startDate} – {edu.endDate || 'Present'}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CandidateDetailsPage;
