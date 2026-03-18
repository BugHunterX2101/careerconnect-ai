import React from 'react';
import { Chip } from '@mui/material';

const MetricChip = ({ label, color = 'default', ...props }) => {
  const paletteByColor = {
    default: { bg: '#ecf3ff', fg: '#40566e', border: '#a7cdff' },
    success: { bg: '#ecfdf4', fg: '#047857', border: '#a7f3d0' },
    warning: { bg: '#fff7e6', fg: '#a74913', border: '#ffd5ad' },
    error: { bg: '#fef2f2', fg: '#b91c1c', border: '#fecaca' },
  };

  const palette = paletteByColor[color] || paletteByColor.default;

  return (
    <Chip
      label={label}
      size="small"
      className="kpi-chip"
      sx={{
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color: palette.fg,
        fontWeight: 700,
      }}
      {...props}
    />
  );
};

export default MetricChip;
