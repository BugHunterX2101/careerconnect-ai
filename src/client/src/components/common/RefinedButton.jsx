import { Button } from '@mui/material';
import { motion } from 'framer-motion';

const MotionButton = motion(Button);

const RefinedButton = ({ children, variant = 'contained', animate = true, ...props }) => {
  return (
    <MotionButton
      variant={variant}
      whileHover={animate ? { scale: 1.02 } : {}}
      whileTap={animate ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </MotionButton>
  );
};

export default RefinedButton;
