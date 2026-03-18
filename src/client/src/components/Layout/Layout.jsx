import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
  alpha,
  Stack,
  Tooltip,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Work,
  Description,
  Person,
  Chat,
  VideoCall,
  Settings,
  Notifications,
  AccountCircle,
  Logout,
  Business,
  Search,
  Add,
  People,
  Schedule,
  Assessment,
  TrendingUp,
  School,
  LinkedIn,
  GitHub,
  AutoAwesome,
  Psychology,
  Analytics,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChatWidget from '../ChatWidget';

const drawerWidth = 280;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const navigationItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['jobseeker', 'employer']
    },
    // Employee/Job Seeker Navigation
    {
      text: 'My Applications',
      icon: <Work />,
      path: '/employee/applications',
      roles: ['jobseeker']
    },
    {
      text: 'My Interviews',
      icon: <Schedule />,
      path: '/employee/interviews',
      roles: ['jobseeker']
    },
    {
      text: 'Resume Management',
      icon: <Description />,
      path: '/resume/upload',
      roles: ['jobseeker']
    },
    {
      text: 'Job Recommendations',
      icon: <TrendingUp />,
      path: '/jobs/recommendations',
      roles: ['jobseeker']
    },
    {
      text: 'Job Search',
      icon: <Search />,
      path: '/jobs/search',
      roles: ['jobseeker']
    },
    // Employer Navigation
    {
      text: 'Job Management',
      icon: <Work />,
      path: '/employer/jobs',
      roles: ['employer']
    },
    {
      text: 'Post New Job',
      icon: <Add />,
      path: '/employer/jobs/post',
      roles: ['employer']
    },
    {
      text: 'Analytics',
      icon: <Assessment />,
      path: '/employer/analytics',
      roles: ['employer']
    },
    {
      text: 'Candidate Search',
      icon: <People />,
      path: '/employer/candidates/search',
      roles: ['employer']
    },
    {
      text: 'Applications',
      icon: <Assessment />,
      path: '/employer/applications',
      roles: ['employer']
    },
    {
      text: 'Interviews',
      icon: <VideoCall />,
      path: '/employer/interviews',
      roles: ['employer']
    },
    {
      text: 'Schedule Interviews',
      icon: <Schedule />,
      path: '/employer/interviews/schedule',
      roles: ['employer']
    },
    // Common Navigation
    {
      text: 'Chat',
      icon: <Chat />,
      path: '/chat',
      roles: ['jobseeker', 'employer']
    },
    {
      text: 'Profile',
      icon: <Person />,
      path: '/profile',
      roles: ['jobseeker', 'employer']
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      roles: ['jobseeker', 'employer']
    }
  ];

  const drawer = (
    <Box className="drawer-content-enter" sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          CareerConnect AI
        </Typography>
        <Chip 
          label={user?.role === 'employer' ? 'Employer' : 'Job Seeker'} 
          size="small" 
          sx={{
            background: user?.role === 'employer' 
              ? 'linear-gradient(135deg, #C4A574 0%, #D4BA94 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, pt: 2, px: 2 }}>
        {navigationItems
          .filter(item => item.roles.includes(user?.role))
          .map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  minHeight: 48,
                  position: 'relative',
                  backgroundColor: isActive 
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  color: isActive ? 'primary.main' : 'text.primary',
                  transition: 'background-color 260ms cubic-bezier(0.16, 1, 0.3, 1), color 260ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': {
                    backgroundColor: isActive 
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateX(3px)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: isActive ? 'translateY(-50%) scaleY(1)' : 'translateY(-50%) scaleY(0)',
                    width: 3,
                    height: 24,
                    opacity: isActive ? 1 : 0,
                    backgroundColor: 'primary.main',
                    borderRadius: '0 2px 2px 0',
                    transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                  }}
                />
              </ListItemButton>
            );
          })}
      </List>

      {/* User Info */}
      <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
              border: '3px solid #ffffff',
              boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)',
            }}
          >
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Person />
            )}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: alpha('#ffffff', 0.95),
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 80, md: 96 }, py: 1.5, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              width: 52,
              height: 52,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'rotate(90deg) scale(1.1)',
              },
            }}
          >
            <MenuIcon sx={{ fontSize: 32, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' }, color: 'text.primary', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '1.125rem', md: '1.25rem' }, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              Welcome back, {user?.firstName}!
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* AI Assistant Button */}
            <Tooltip title="AI Assistant">
              <IconButton 
                sx={{ 
                  width: 52,
                  height: 52,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'translateY(-3px) rotate(10deg) scale(1.1)',
                  },
                }}
              >
                <AutoAwesome sx={{ fontSize: 28, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                sx={{ 
                  width: 52,
                  height: 52,
                  color: 'text.secondary',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-3px) scale(1.1)',
                  },
                }}
              >
                <Badge 
                  badgeContent={4} 
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      minWidth: 24,
                      height: 24,
                      transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    },
                  }}
                >
                  <Notifications sx={{ fontSize: 28, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Tooltip title="Profile Menu">
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ 
                  ml: 1,
                  width: 56,
                  height: 56,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-3px) scale(1.05)',
                  },
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 48, 
                    height: 48,
                    background: 'linear-gradient(135deg, #8B6F47 0%, #6B5544 100%)',
                    border: '2px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(139, 111, 71, 0.3)',
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Person />
                  )}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          transitionDuration={{ enter: 240, exit: 180 }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 9,
          backgroundColor: '#FAF3E0',
          minHeight: 'calc(100vh - 72px)',
        }}
      >
        <Box className="animate-fade-in">
          {children}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <MenuItem 
          onClick={() => navigate('/profile')}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ color: 'primary.main' }}>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Profile" 
            secondary="Manage your account"
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => navigate('/settings')}
          sx={{
            py: 1.5,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ color: 'text.secondary' }}>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            secondary="Preferences & privacy"
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Sign Out" 
            secondary="See you later!"
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>
      </Menu>

      {/* Chat Widget */}
      <ChatWidget />
    </Box>
  );
};

export default Layout;
