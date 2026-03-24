/**
 * useResponsive Hook
 *
 * Returns current breakpoint and convenience booleans.
 * Debounces resize events to prevent re-render thrashing.
 */

import { useState, useEffect, useRef } from 'react';
import { BREAKPOINTS } from '../utils/constants';

function getBreakpoint(width) {
  if (width < BREAKPOINTS.small) return 'small';
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

export function useResponsive() {
  const [state, setState] = useState(() => {
    const w = window.innerWidth;
    return { breakpoint: getBreakpoint(w), windowWidth: w };
  });
  const timer = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const w = window.innerWidth;
        setState({ breakpoint: getBreakpoint(w), windowWidth: w });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const bp = state.breakpoint;
  return {
    breakpoint: bp,
    windowWidth: state.windowWidth,
    isSmall: bp === 'small',
    isMobile: bp === 'small' || bp === 'mobile',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
    isMobileOrTablet: bp !== 'desktop',
  };
}

export default useResponsive;
