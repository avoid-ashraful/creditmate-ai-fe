import React from 'react';

import Toast from './Toast';

export default {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: {
    a11y: { manualAddonSteps: false },
    viewport: { defaultViewport: 'mobile1' },
  },
  argTypes: {
    message: { control: 'text', description: 'Toast message content' },
    className: { control: 'text', description: 'Additional CSS classes' },
  },
};

/* State: basic success message */
export const Success = {
  args: {
    message: 'Card added to comparison successfully!',
  },
};

/* State: error message */
export const Error = {
  args: {
    message: 'Failed to load card details. Please try again.',
  },
};

/* State: info message */
export const Info = {
  args: {
    message: 'Your preferences have been saved.',
  },
};

/* State: long message wrapping */
export const LongMessage = {
  args: {
    message:
      'This is a very long toast message that should wrap across multiple lines on mobile screens to test responsive behavior and text truncation handling.',
  },
};

/* State: empty message (hidden) */
export const Empty = {
  args: {
    message: '',
  },
};

/* State: with custom className */
export const WithCustomClass = {
  args: {
    message: 'Custom styled toast',
    className: 'toast-custom',
  },
};

/* State: rapid message changes (tests AnimatePresence) */
const rapidMessages = [
  'Initial message',
  'Second message appears',
  'Third message with different length',
  'Final message',
];

export const RapidChanges = () => {
  const [message, setMessage] = React.useState('Initial message');
  const indexRef = React.useRef(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % rapidMessages.length;
      setMessage(rapidMessages[indexRef.current]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return <Toast message={message} />;
};

RapidChanges.storyName = 'Rapid Changes (Animation Test)';
