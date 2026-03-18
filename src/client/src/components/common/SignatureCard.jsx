import React from 'react';
import { Card } from '@mui/material';

const SignatureCard = ({ children, sx = {}, accent = true, ...props }) => {
  return (
    <Card
      className="signature-card"
      sx={{
        position: 'relative',
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
        boxShadow: '0 10px 30px rgba(27, 43, 59, 0.08)',
        ...(accent
          ? {
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: '0 0 auto 0',
                height: 3,
                background: 'linear-gradient(90deg, #0f5fcc 0%, #f57a2e 85%)',
              },
            }
          : {}),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Card>
  );
};

export default SignatureCard;
