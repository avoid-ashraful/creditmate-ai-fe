import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';

// Color variables to match the existing theme
const colors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',
  secondary: '#0f172a',
  accent: '#10b981',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
};

// Gradient backgrounds
export const GradientBackground = createGlobalStyle`
  body {
    background: linear-gradient(135deg, ${colors.background} 0%, #eef2ff 100%);
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
  background: linear-gradient(-45deg, ${colors.primary}, ${colors.primaryLight}, #4f46e5, #818cf8);
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
  }
  
  .logo a {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .main-nav ul {
    display: flex;
    gap: 1.5rem;
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
`;

// Animated card component
export const AnimatedCard = styled(motion.div)`
  background: white;
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
    background: linear-gradient(90deg, ${colors.accent}, #059669);
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

// Animation variants for Framer Motion
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Shimmer effect for loading states
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

export const ShimmerCard = styled.div`
  background: #f0f0f0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 0.5rem;
  height: 200px;
  margin-bottom: 1rem;
`;