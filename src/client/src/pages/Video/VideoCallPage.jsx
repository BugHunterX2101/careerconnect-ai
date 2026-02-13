import React from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { VideoCall, Mic, MicOff, Videocam, VideocamOff } from '@mui/icons-material';

const VideoCallPage = () => {
  const { roomId } = useParams();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Video Call
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Video interview and meeting interface
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Video Conference Room
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will provide video calling functionality for interviews and meetings.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Mic />}>
              Mute
            </Button>
            <Button variant="outlined" startIcon={<Videocam />}>
              Video
            </Button>
            <Button variant="contained" color="error">
              End Call
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VideoCallPage;
