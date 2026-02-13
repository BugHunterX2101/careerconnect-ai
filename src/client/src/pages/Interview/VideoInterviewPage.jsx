import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Avatar, Chip, IconButton, TextField, List, ListItem,
  ListItemText, ListItemAvatar, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress,
  Fab, Badge, Drawer, AppBar, Toolbar
} from '@mui/material';
import {
  VideoCall, Mic, MicOff, Videocam, VideocamOff,
  ScreenShare, StopScreenShare, Chat, Send, Close,
  CallEnd, Settings, FullscreenExit, Fullscreen,
  Person, Business, AccessTime, Event, Phone
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useParams, useNavigate } from 'react-router-dom';

const VideoInterviewPage = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  // Interview state
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetLink, setMeetLink] = useState(null);
  
  // Video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [typing, setTyping] = useState(false);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const callTimerRef = useRef(null);
  
  // WebRTC state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    fetchInterviewDetails();
    setupSocketListeners();
    
    return () => {
      cleanupCall();
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [interviewId]);

  useEffect(() => {
    if (isCallActive && callStartTime) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isCallActive, callStartTime]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInterviewDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/video/interviews/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
        
        // Get Google Meet link if it's a video interview
        if (data.interview.type === 'video') {
          fetchMeetLink();
        }
      } else {
        setError('Interview not found');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      setError('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetLink = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/video/meet-link/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetLink(data.meetLink);
      }
    } catch (error) {
      console.error('Error fetching meet link:', error);
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('video_offer', handleVideoOffer);
    socket.on('video_answer', handleVideoAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('interview:started', handleInterviewStarted);
    socket.on('interview:ended', handleInterviewEnded);

    return () => {
      socket.off('video_offer');
      socket.off('video_answer');
      socket.off('ice_candidate');
      socket.off('chat:new_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('interview:started');
      socket.off('interview:ended');
    };
  };

  const initializeWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            interviewId,
            candidate: event.candidate
          });
        }
      };

      setPeerConnection(pc);
      return pc;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      setError('Failed to access camera/microphone');
    }
  };

  const startCall = async () => {
    try {
      const pc = await initializeWebRTC();
      if (!pc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket) {
        socket.emit('video_offer', {
          interviewId,
          offer
        });
        socket.emit('join_video_call', interviewId);
      }

      setIsCallActive(true);
      setCallStartTime(Date.now());
      
      // Update interview status
      updateInterviewStatus('in_progress');
    } catch (error) {
      console.error('Error starting call:', error);
      setError('Failed to start video call');
    }
  };

  const endCall = async () => {
    try {
      cleanupCall();
      setIsCallActive(false);
      setCallStartTime(null);
      setCallDuration(0);
      
      if (socket) {
        socket.emit('leave_video_call', interviewId);
      }
      
      // Update interview status
      updateInterviewStatus('completed');
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    
    setRemoteStream(null);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (peerConnection && localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
          
          videoTrack.onended = () => {
            setIsScreenSharing(false);
            // Switch back to camera
            const cameraTrack = localStream.getVideoTracks()[0];
            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack);
            }
          };
        }
        
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing and switch back to camera
        if (peerConnection && localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender && cameraTrack) {
            await sender.replaceTrack(cameraTrack);
          }
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleVideoOffer = async ({ offer, from }) => {
    try {
      const pc = await initializeWebRTC();
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit('video_answer', {
          interviewId,
          answer
        });
      }

      setIsCallActive(true);
      setCallStartTime(Date.now());
    } catch (error) {
      console.error('Error handling video offer:', error);
    }
  };

  const handleVideoAnswer = async ({ answer }) => {
    try {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling video answer:', error);
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    try {
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      content: newMessage,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send via socket for real-time delivery
    if (socket) {
      socket.emit('send_message', {
        interviewId,
        message
      });
    }
  };

  const handleNewMessage = ({ message }) => {
    setMessages(prev => [...prev, message]);
    if (!isChatOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleUserTyping = () => {
    setTyping(true);
    setTimeout(() => setTyping(false), 3000);
  };

  const handleUserStoppedTyping = () => {
    setTyping(false);
  };

  const handleInterviewStarted = () => {
    setIsCallActive(true);
    setCallStartTime(Date.now());
  };

  const handleInterviewEnded = () => {
    setIsCallActive(false);
    endCall();
  };

  const updateInterviewStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/video/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error('Error updating interview status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const joinGoogleMeet = () => {
    if (meetLink) {
      window.open(meetLink, '_blank');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/interviews')} sx={{ mt: 2 }}>
          Back to Interviews
        </Button>
      </Box>
    );
  }

  const otherParticipant = interview?.candidate?._id === user.id 
    ? interview?.interviewer 
    : interview?.candidate;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Avatar sx={{ mr: 2 }}>
              {otherParticipant?.role === 'employer' ? <Business /> : <Person />}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {interview?.job?.title} - Interview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                with {otherParticipant?.firstName} {otherParticipant?.lastName}
              </Typography>
            </Box>
          </Box>
          
          {isCallActive && (
            <Chip 
              icon={<AccessTime />}
              label={formatDuration(callDuration)}
              color="primary"
              sx={{ mr: 2 }}
            />
          )}
          
          <Button
            variant="outlined"
            onClick={() => navigate('/interviews')}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex' }}>
        {/* Video Area */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: 'black' }}>
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 200,
              height: 150,
              bgcolor: 'grey.900',
              borderRadius: 1,
              overflow: 'hidden',
              border: '2px solid white'
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>

          {/* Call Controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 2,
              p: 1
            }}
          >
            <IconButton
              onClick={toggleMute}
              sx={{ 
                color: 'white',
                bgcolor: isMuted ? 'error.main' : 'rgba(255,255,255,0.2)'
              }}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </IconButton>
            
            <IconButton
              onClick={toggleVideo}
              sx={{ 
                color: 'white',
                bgcolor: isVideoOff ? 'error.main' : 'rgba(255,255,255,0.2)'
              }}
            >
              {isVideoOff ? <VideocamOff /> : <Videocam />}
            </IconButton>
            
            <IconButton
              onClick={toggleScreenShare}
              sx={{ 
                color: 'white',
                bgcolor: isScreenSharing ? 'primary.main' : 'rgba(255,255,255,0.2)'
              }}
            >
              {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
            </IconButton>
            
            {!isCallActive ? (
              <Button
                variant="contained"
                color="success"
                onClick={startCall}
                startIcon={<VideoCall />}
                sx={{ mx: 1 }}
              >
                Start Call
              </Button>
            ) : (
              <IconButton
                onClick={endCall}
                sx={{ 
                  color: 'white',
                  bgcolor: 'error.main'
                }}
              >
                <CallEnd />
              </IconButton>
            )}
            
            <IconButton
              onClick={toggleFullscreen}
              sx={{ color: 'white' }}
            >
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Box>

          {/* Google Meet Integration */}
          {meetLink && !isCallActive && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'white'
              }}
            >
              <Typography variant="h5" gutterBottom>
                Ready to start your interview?
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                You can use our built-in video call or join via Google Meet
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={startCall}
                  startIcon={<VideoCall />}
                >
                  Start Built-in Call
                </Button>
                <Button
                  variant="outlined"
                  onClick={joinGoogleMeet}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Join Google Meet
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* Chat Sidebar */}
        <Drawer
          anchor="right"
          open={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          variant="persistent"
          PaperProps={{
            sx: { 
              width: 350,
              position: 'relative',
              height: '100%'
            }
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Interview Chat</Typography>
                <IconButton onClick={() => setIsChatOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      flexDirection: 'column',
                      alignItems: message.senderId === user.id ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1,
                        maxWidth: '80%',
                        bgcolor: message.senderId === user.id ? 'primary.main' : 'grey.100',
                        color: message.senderId === user.id ? 'white' : 'text.primary'
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
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
                
                {typing && (
                  <ListItem>
                    <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                      <Typography variant="body2" color="text.secondary">
                        {otherParticipant?.firstName} is typing...
                      </Typography>
                    </Paper>
                  </ListItem>
                )}
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
          </Box>
        </Drawer>
      </Box>

      {/* Chat Toggle Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => {
          setIsChatOpen(true);
          setUnreadCount(0);
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Chat />
        </Badge>
      </Fab>
    </Box>
  );
};

export default VideoInterviewPage;