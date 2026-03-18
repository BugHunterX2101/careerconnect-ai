import React from 'react';
import { Box } from '@mui/material';
import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';

const TrendBadge = ({ direction = 'up', label }) => {
  const icon = direction === 'up' ? <TrendingUp sx={{ fontSize: 14 }} /> : direction === 'down' ? <TrendingDown sx={{ fontSize: 14 }} /> : <TrendingFlat sx={{ fontSize: 14 }} />;

  return (
    <Box className={`trend-badge ${direction}`}>
      {icon}
      <span>{label}</span>
    </Box>
  );
};

export default TrendBadge;
