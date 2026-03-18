import React from 'react';
import { TableContainer } from '@mui/material';

const ExecutiveTable = ({ children, compact = false, ...props }) => {
  return (
    <TableContainer className={`dashboard-table ${compact ? 'compact' : ''}`} {...props}>
      {children}
    </TableContainer>
  );
};

export default ExecutiveTable;
