import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Chat } from '@mui/icons-material';

const ChatPage = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Chat
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Real-time messaging and communication
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Chat sx={{ mr: 1 }} />
            Messaging Interface
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This page will include real-time chat functionality for communication between job seekers and employers.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatPage;
