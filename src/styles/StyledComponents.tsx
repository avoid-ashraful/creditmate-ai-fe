import { motion } from 'framer-motion';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

// Color variables to match the existing theme
const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',
  secondary: '#0f172a',
  accent: '#047857',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
};

// Gradient backgrounds
export const GradientBackground = createGlobalStyle`
  body {
    background: var(--color-gradient-background);
  }
`;

// Animated background gradient
const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Header with animated gradient
export const GradientHeader = styled.header`
  background: var(--color-gradient-header);
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .main-nav {
    flex: 1 1 720px;
    min-width: 0;
    max-width: 100%;
  }

  .logo a {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .main-nav ul {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .main-nav li {
    flex: 0 0 auto;
  }

  .main-nav a {
    color: white;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }

  .main-nav a:hover,
  .main-nav a.active {
    background-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .header-content {
      padding: 0.75rem 1rem;
      gap: 0.5rem 1rem;
    }

    /* Wrapping every nav item onto its own row would stack the sticky header
       across the whole phone viewport and cover the page beneath it. Keep two
       rows instead: the nav row scrolls horizontally, its links stay on the
       gradient, and each stays keyboard-focusable for axe's scroll rules. */
    .main-nav {
      flex: 1 1 100%;
      padding-block: 4px;
      overflow-x: auto;
      scrollbar-width: thin;
    }

    .main-nav ul {
      flex-wrap: nowrap;
    }
  }
`;

// Animated card component
export const AnimatedCard = styled(motion.div)`
  background: var(--color-background-surface);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: all 0.3s ease;
  border: 1px solid ${colors.border};
  overflow: hidden;
  position: relative;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-4px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, ${colors.primary}, ${colors.accent});
  }
`;

// Button with gradient
export const GradientButton = styled(motion.button)`
  background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryDark});
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);

  &:hover {
    background: linear-gradient(90deg, ${colors.primaryDark}, ${colors.primary});
    box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

// Footer with gradient
export const GradientFooter = styled.footer`
  background: linear-gradient(to right, ${colors.secondary}, #1e293b);
  color: white;
  padding: 2rem 0 1rem;
  margin-top: auto;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }

  .footer-section h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -0.5rem;
      left: 0;
      width: 2rem;
      height: 2px;
      background: linear-gradient(90deg, ${colors.primary}, ${colors.accent});
    }
  }

  .footer-section ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-section a {
    color: #e2e8f0;
    transition: all 0.2s ease;

    &:hover {
      color: white;
      transform: translateX(2px);
    }
  }

  .copyright {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.875rem;
    color: #94a3b8;
  }
`;

// Comparison bar with gradient
export const GradientComparisonBar = styled.div`
  background: linear-gradient(to right, ${colors.secondary}, #1e293b);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);

  .comparison-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .selected-cards {
    display: flex;
    gap: 1rem;
  }

  .compare-button {
    background: var(--color-gradient-accent-button);
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);
    }
  }
`;
