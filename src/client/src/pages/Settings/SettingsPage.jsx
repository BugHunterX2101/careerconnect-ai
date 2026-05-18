import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  Security,
  Palette,
  Language,
  Delete,
  Download,
  Visibility,
  Lock,
  Email,
  Smartphone,
} from '@mui/icons-material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      jobAlerts: true,
      messageAlerts: true,
      weeklyDigest: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      allowMessages: true,
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC-8',
    },
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get('/profile');
        const data = res.data?.data || res.data || {};
        if (data.settings) {
          setSettings(prev => ({
            notifications: { ...prev.notifications, ...(data.settings.notifications || {}) },
            privacy: { ...prev.privacy, ...(data.settings.privacy || {}) },
            preferences: { ...prev.preferences, ...(data.settings.preferences || {}) },
          }));
        }
      } catch (err) {
        // silently use defaults if profile fetch fails
      }
    };
    loadSettings();
  }, []);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [setting]: value },
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await api.put('/profile', { settings });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.post('/profile/export', {}, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'careerconnect-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed. Please try again.');
      console.error('Export error:', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      setError('Account deletion failed. Please contact support.');
      console.error('Delete account error:', err);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordData.new.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    try {
      setSavingPassword(true);
      setError('');
      await api.put('/auth/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      setSuccess('Password changed successfully!');
      setChangePasswordOpen(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to change password.');
      console.error('Change password error:', err);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Settings
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card className="hover-lift">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ mr: 1 }} />
                Notifications
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Email Notifications" secondary="Receive updates via email" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.notifications.email} onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Push Notifications" secondary="Browser push notifications" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.notifications.push} onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Job Alerts" secondary="New job recommendations" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.notifications.jobAlerts} onChange={(e) => handleSettingChange('notifications', 'jobAlerts', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Message Alerts" secondary="New chat messages" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.notifications.messageAlerts} onChange={(e) => handleSettingChange('notifications', 'messageAlerts', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Weekly Digest" secondary="Weekly summary email" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.notifications.weeklyDigest} onChange={(e) => handleSettingChange('notifications', 'weeklyDigest', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy */}
        <Grid item xs={12} md={6}>
          <Card className="hover-lift">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1 }} />
                Privacy & Security
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Profile Visibility" secondary="Who can see your profile" />
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={settings.privacy.profileVisibility} onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}>
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                        <MenuItem value="connections">Connections Only</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Show Email" secondary="Display email on profile" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.privacy.showEmail} onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Show Phone" secondary="Display phone on profile" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.privacy.showPhone} onChange={(e) => handleSettingChange('privacy', 'showPhone', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Allow Messages" secondary="Receive messages from other users" />
                  <ListItemSecondaryAction>
                    <Switch checked={settings.privacy.allowMessages} onChange={(e) => handleSettingChange('privacy', 'allowMessages', e.target.checked)} />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12} md={6}>
          <Card className="hover-lift">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Palette sx={{ mr: 1 }} />
                Preferences
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Language" secondary="Interface language" />
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={settings.preferences.language} onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}>
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Timezone" secondary="Your local timezone" />
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select value={settings.preferences.timezone} onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}>
                        <MenuItem value="UTC-8">PST (UTC-8)</MenuItem>
                        <MenuItem value="UTC-5">EST (UTC-5)</MenuItem>
                        <MenuItem value="UTC+0">GMT (UTC+0)</MenuItem>
                        <MenuItem value="UTC+1">CET (UTC+1)</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Actions */}
        <Grid item xs={12} md={6}>
          <Card className="hover-lift">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Lock sx={{ mr: 1 }} />
                Account Actions
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Change Password" secondary="Update your account password" />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" size="small" onClick={() => setChangePasswordOpen(true)}>Change</Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Export Data" secondary="Download your account data" />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleExportData}>Export</Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Delete Account" secondary="Permanently delete your account" secondaryTypographyProps={{ color: 'error' }} />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" size="small" color="error" startIcon={<Delete />} onClick={() => setDeleteDialogOpen(true)}>Delete</Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveSettings}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ px: 4, py: 1.5, background: 'linear-gradient(135deg, #A67C52 0%, #C4A574 100%)' }}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField fullWidth type="password" label="Current Password" value={passwordData.current}
            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth type="password" label="New Password" value={passwordData.new}
            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth type="password" label="Confirm New Password" value={passwordData.confirm}
            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={savingPassword}>
            {savingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>This action cannot be undone. All your data will be permanently deleted.</Alert>
          <Typography variant="body1">Are you sure you want to delete your account? This will permanently remove:</Typography>
          <List dense sx={{ mt: 1 }}>
            <ListItem>• Your profile and personal information</ListItem>
            <ListItem>• All job applications and history</ListItem>
            <ListItem>• Saved jobs and preferences</ListItem>
            <ListItem>• Chat messages and conversations</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">Delete Account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
