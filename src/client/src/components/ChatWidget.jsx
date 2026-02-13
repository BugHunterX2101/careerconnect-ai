import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, IconButton, List,
  ListItem, ListItemText, ListItemAvatar, Avatar,
  Badge, Fab, Drawer, AppBar, Toolbar, Divider,
  Chip, Button, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  Chat, Send, Close, MoreVert, AttachFile,
  VideoCall, Phone, Search, Add
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchDialog, setSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConversations(data.conversations || []);
      
      const unread = data.conversations?.reduce((count, conv) => {
        return count + (conv.unreadBy?.includes(user.userId) ? 1 : 0);
      }, 0) || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const response = await fetch(`/api/chat/conversations/${activeConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startNewConversation = async (participantId) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          participantIds: [participantId],
          type: 'direct'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveConversation(data.conversation);
        setSearchDialog(false);
        loadConversations();
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/employer/candidates/search?keywords=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSearchResults(data.candidates || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(p => p._id !== user.userId);
  };

  return (
    <>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => setIsOpen(true)}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Chat />
        </Badge>
      </Fab>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {activeConversation ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={getOtherParticipant(activeConversation)?.profile?.avatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {getOtherParticipant(activeConversation)?.firstName?.[0]}
                    </Avatar>
                    {getOtherParticipant(activeConversation)?.firstName} {getOtherParticipant(activeConversation)?.lastName}
                  </Box>
                ) : (
                  'Messages'
                )}
              </Typography>
              
              {activeConversation && (
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  <MoreVert />
                </IconButton>
              )}
              
              <IconButton onClick={() => setIsOpen(false)}>
                <Close />
              </IconButton>
            </Toolbar>
          </AppBar>

          {!activeConversation ? (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setSearchDialog(true)}
                >
                  Start New Chat
                </Button>
              </Box>
              
              <List sx={{ flex: 1, overflow: 'auto' }}>
                {conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  return (
                    <ListItem
                      key={conversation._id}
                      button
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <ListItemAvatar>
                        <Avatar src={otherParticipant?.profile?.avatar}>
                          {otherParticipant?.firstName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${otherParticipant?.firstName} ${otherParticipant?.lastName}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" noWrap>
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      {conversation.unreadBy?.includes(user.userId) && (
                        <Chip size="small" color="primary" label="New" />
                      )}
                    </ListItem>
                  );
                })}
                
                {conversations.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No conversations yet
                    </Typography>
                    <Button
                      variant="text"
                      onClick={() => setSearchDialog(true)}
                      sx={{ mt: 1 }}
                    >
                      Start your first chat
                    </Button>
                  </Box>
                )}
              </List>
            </Box>
          ) : (
            <>
              <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                <List>
                  {messages.map((message) => (
                    <ListItem
                      key={message._id}
                      sx={{
                        flexDirection: 'column',
                        alignItems: message.sender._id === user.userId ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          maxWidth: '70%',
                          bgcolor: message.sender._id === user.userId ? 'primary.main' : 'grey.100',
                          color: message.sender._id === user.userId ? 'white' : 'text.primary'
                        }}
                      >
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5
                          }}
                        >
                          {formatTime(message.createdAt)}
                        </Typography>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
                <div ref={messagesEndRef} />
              </Box>
              
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <VideoCall sx={{ mr: 1 }} />
          Video Call
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Phone sx={{ mr: 1 }} />
          Phone Call
        </MenuItem>
        <MenuItem onClick={() => {
          setActiveConversation(null);
          setAnchorEl(null);
        }}>
          <Close sx={{ mr: 1 }} />
          Close Chat
        </MenuItem>
      </Menu>

      <Dialog open={searchDialog} onClose={() => setSearchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
          />
          
          <List>
            {searchResults.map((candidate) => (
              <ListItem
                key={candidate._id}
                button
                onClick={() => startNewConversation(candidate._id)}
              >
                <ListItemAvatar>
                  <Avatar src={candidate.profile?.avatar}>
                    {candidate.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${candidate.firstName} ${candidate.lastName}`}
                  secondary={candidate.profile?.title || candidate.email}
                />
              </ListItem>
            ))}
            
            {searchQuery && searchResults.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No candidates found"
                  secondary="Try a different search term"
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatWidget;