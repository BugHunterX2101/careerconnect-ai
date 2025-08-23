import React from 'react'
import { Box, Typography, Container } from '@mui/material'

const JobRecommendationsPage = () => {
  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4">Job Recommendations</Typography>
        <Typography variant="body1">AI-powered job recommendations will be displayed here.</Typography>
      </Box>
    </Container>
  )
}

export default JobRecommendationsPage
