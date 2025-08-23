import React from 'react'
import { Box, Typography, Container } from '@mui/material'

const JobDetailsPage = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Job Details</Typography>
        <Typography variant="body1">Detailed job information will be displayed here.</Typography>
      </Box>
    </Container>
  )
}

export default JobDetailsPage
