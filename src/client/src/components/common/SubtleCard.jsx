import { Card, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const SubtleCard = ({ children, hover = true, animate = true, delay = 0, ...props }) => {
  return (
    <MotionCard
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        ...(hover && {
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'primary.main',
            transform: 'translateY(-4px)',
            '& .card-accent': { transform: 'scaleX(1)' },
          },
        }),
        ...props.sx,
      }}
      {...props}
    >
      <Box className="card-accent" sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: 'secondary.main', transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      {children}
    </MotionCard>
  );
};

export default SubtleCard;
