import React, { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const CountUpNumber = ({
  value,
  duration = 800,
  decimals = 0,
  suffix = '',
  prefix = '',
  startOnView = true,
  reducedMotion = false,
  className,
}) => {
  const [display, setDisplay] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const nodeRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(Number(value) || 0);
      setHasPlayed(true);
      return;
    }

    if (!startOnView) {
      setHasPlayed(false);
      return;
    }

    if (!nodeRef.current || hasPlayed) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) {
          setHasPlayed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, [hasPlayed, reducedMotion, startOnView, value]);

  useEffect(() => {
    const target = Number(value) || 0;

    if (reducedMotion || !hasPlayed) {
      if (reducedMotion) {
        setDisplay(target);
      }
      return;
    }

    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      setDisplay(target * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [duration, hasPlayed, reducedMotion, value]);

  return React.createElement(
    'span',
    { ref: nodeRef, className },
    `${prefix}${display.toFixed(decimals)}${suffix}`
  );
};

export default CountUpNumber;
