import React from 'react'
import { Box, Typography, Container } from '@mui/material'

const CandidateDetailsPage = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Candidate Details</Typography>
        <Typography variant="body1">Candidate profile and details will be displayed here.</Typography>
      </Box>
    </Container>
  )
}

export default CandidateDetailsPage
