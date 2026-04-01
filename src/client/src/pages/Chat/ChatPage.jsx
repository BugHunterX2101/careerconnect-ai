import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Badge,
  Paper,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Send,
  AttachFile,
  Search,
  MoreVert,
  VideoCall,
  Phone,
  Person,
  Business,
  Close,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useSearchParams } from 'react-router-dom';
const ChatPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  // Inline helpers replacing the non-existent SocketContext methods
  const joinConversation = (id) => socket?.emit('join_conversation', id);
  const leaveConversation = (id) => socket?.emit('leave_conversation', id);
  const startTyping = (id) => socket?.emit('typing_start', { conversationId: id });
  const stopTyping = (id) => socket?.emit('typing_stop', { conversationId: id });
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [messageStatus, setMessageStatus] = useState({});
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    
    // Auto-start conversation if user parameter is provided
    const targetUserId = searchParams.get('user');
    if (targetUserId && targetUserId !== 'unknown') {
      startConversationWithUser(targetUserId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('user_online', handleUserOnline);
      socket.on('user_offline', handleUserOffline);
      socket.on('message_delivered', handleMessageDelivered);
      socket.on('message_read', handleMessageRead);
      
      return () => {
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('message_delivered');
        socket.off('message_read');
      };
    }
  }, [socket, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Join conversation room
        joinConversation(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachmentPreview) || !activeConversation) return;

    const tempId = Date.now().toString();
    const tempMessage = {
      id: tempId,
      content: newMessage,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      status: 'sending',
      type: attachmentPreview ? 'file' : 'text',
      attachment: attachmentPreview
    };

    // Add message optimistically
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setAttachmentPreview(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', newMessage);
      
      if (attachmentPreview) {
        formData.append('attachment', attachmentPreview.file);
      }

      const response = await fetch(`http://localhost:3000/api/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        // Replace temp message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...data.message, status: 'sent' } : msg
        ));
        
        // Real-time delivery handled by socket context
      } else {
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const preview = {
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      setAttachmentPreview(preview);
    }
  };

  const removeAttachment = () => {
    if (attachmentPreview?.url) {
      URL.revokeObjectURL(attachmentPreview.url);
    }
    setAttachmentPreview(null);
  };

  const handleUserOnline = ({ userId }) => {
    setOnlineUsers(prev => new Set([...prev, userId]));
  };

  const handleUserOffline = ({ userId }) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const handleMessageDelivered = ({ messageId }) => {
    setMessageStatus(prev => ({ ...prev, [messageId]: 'delivered' }));
  };

  const handleMessageRead = ({ messageId }) => {
    setMessageStatus(prev => ({ ...prev, [messageId]: 'read' }));
  };

  const handleNewMessage = (message) => {
    if (activeConversation && message.conversationId === activeConversation.id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update conversation list with latest message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === message.conversationId 
          ? { ...conv, lastMessage: message, unreadCount: (conv.unreadCount || 0) + 1 }
          : conv
      )
    );
  };

  const handleUserTyping = ({ userId, conversationId }) => {
    if (activeConversation && conversationId === activeConversation.id && userId !== user.id) {
      setTyping(true);
    }
  };

  const handleUserStoppedTyping = ({ userId, conversationId }) => {
    if (activeConversation && conversationId === activeConversation.id && userId !== user.id) {
      setTyping(false);
    }
  };

  const handleTyping = () => {
    if (activeConversation) {
      startTyping(activeConversation.id);
      
      // Stop typing after 3 seconds
      setTimeout(() => {
        stopTyping(activeConversation.id);
      }, 3000);
    }
  };

  const startConversationWithUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participantIds: [userId],
          type: 'direct'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveConversation(data.conversation);
        fetchMessages(data.conversation.id);
        fetchConversations(); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participants?.some(p => 
      p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Conversations Sidebar */}
      <Card sx={{ width: 320, borderRadius: 0 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            {t('messages')}
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List sx={{ p: 0 }}>
              {filteredConversations.map((conversation) => {
                const otherParticipant = conversation.participants?.find(p => p.id !== user.id);
                return (
                  <ListItem
                    key={conversation.id}
                    button
                    onClick={() => handleConversationClick(conversation)}
                    selected={activeConversation?.id === conversation.id}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conversation.unreadCount || 0}
                        color="error"
                        invisible={!conversation.unreadCount}
                      >
                        <Avatar>
                          {otherParticipant?.role === 'employer' ? <Business /> : <Person />}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle2">
                            {otherParticipant?.firstName} {otherParticipant?.lastName}
                          </Typography>
                          {otherParticipant?.role === 'employer' && (
                            <Chip 
                              label="Employer" 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1, height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </Typography>
                          {otherParticipant?.company && (
                            <Typography variant="caption" color="text.secondary">
                              {otherParticipant.company}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <Paper sx={{ p: 2, borderRadius: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2 }}>
                    {activeConversation.participants?.find(p => p.id !== user.id)?.role === 'employer' ? <Business /> : <Person />}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {activeConversation.participants?.find(p => p.id !== user.id)?.firstName}{' '}
                      {activeConversation.participants?.find(p => p.id !== user.id)?.lastName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          bgcolor: onlineUsers.has(activeConversation.participants?.find(p => p.id !== user.id)?.id) ? 'success.main' : 'grey.400',
                          mr: 1 
                        }} 
                      />
                      <Typography variant="body2" color="text.secondary">
                        {onlineUsers.has(activeConversation.participants?.find(p => p.id !== user.id)?.id) ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <IconButton>
                    <VideoCall />
                  </IconButton>
                  <IconButton>
                    <Phone />
                  </IconButton>
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>
            </Paper>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.senderId === user.id ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      backgroundColor: message.senderId === user.id ? 'primary.main' : 'white',
                      color: message.senderId === user.id ? 'white' : 'text.primary',
                    }}
                  >
                    {message.type === 'file' && message.attachment ? (
                      <Box>
                        {message.attachment.type?.startsWith('image/') ? (
                          <img 
                            src={message.attachment.url || `data:${message.attachment.mimetype};base64,${message.attachment.data}`}
                            alt={message.attachment.filename}
                            style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
                            <AttachFile sx={{ mr: 1 }} />
                            <Typography variant="body2">{message.attachment.filename}</Typography>
                          </Box>
                        )}
                        {message.content && (
                          <Typography variant="body1" sx={{ mt: 1 }}>{message.content}</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body1">{message.content}</Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ opacity: 0.7 }}
                      >
                        {formatTime(message.createdAt)}
                      </Typography>
                      
                      {message.senderId === user.id && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {message.status === 'sending' && <CircularProgress size={12} />}
                          {message.status === 'sent' && <CheckCircle sx={{ fontSize: 12, opacity: 0.7 }} />}
                          {message.status === 'delivered' && <CheckCircle sx={{ fontSize: 12, color: 'success.main' }} />}
                          {message.status === 'read' && <CheckCircle sx={{ fontSize: 12, color: 'primary.main' }} />}
                          {message.status === 'failed' && <Error sx={{ fontSize: 12, color: 'error.main' }} />}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Box>
              ))}
              
              {typing && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                  <Paper sx={{ p: 1.5, backgroundColor: 'white' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('typing')}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Message Input */}
            <Paper sx={{ p: 2, borderRadius: 0 }}>
              {/* Attachment Preview */}
              {attachmentPreview && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {attachmentPreview.type.startsWith('image/') ? (
                        <img 
                          src={attachmentPreview.url} 
                          alt={attachmentPreview.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '8px' }}
                        />
                      ) : (
                        <AttachFile sx={{ mr: 1 }} />
                      )}
                      <Box>
                        <Typography variant="body2">{attachmentPreview.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(attachmentPreview.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton onClick={removeAttachment} size="small">
                      <Close />
                    </IconButton>
                  </Box>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                />
                <IconButton onClick={() => fileInputRef.current?.click()}>
                  <AttachFile />
                </IconButton>
                
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  multiline
                  maxRows={4}
                  variant="outlined"
                  size="small"
                />
                
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !attachmentPreview}
                  sx={{ minWidth: 'auto', p: 1.5 }}
                >
                  <Send />
                </Button>
              </Box>
            </Paper>
          </>
        ) : (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Select a conversation to start messaging
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect with employers and discuss job opportunities
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatPage;