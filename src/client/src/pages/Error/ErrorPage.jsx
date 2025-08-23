import React from 'react'
import { Box, Typography, Container, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const ErrorPage = () => {
  const navigate = useNavigate()

  return (
    <Container>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          Oops!
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We're sorry, but something unexpected happened. Please try again later.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  )
}

export default ErrorPage
