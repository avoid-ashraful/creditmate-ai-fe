import React, { useState } from 'react';

import SliderWithBubble from './SliderWithBubble';

export default {
  title: 'UI/SliderWithBubble',
  component: SliderWithBubble,
  tags: ['autodocs'],
};

const SpendSliderDemo: React.FC = () => {
  const [value, setValue] = useState(50000);
  return (
    <SliderWithBubble
      value={value}
      min={10000}
      max={500000}
      step={10000}
      onChange={setValue}
      formatValue={v => `Tk ${v.toLocaleString('en-IN')}`}
      ariaLabel="Monthly spend"
    />
  );
};

export const SpendSlider = {
  render: () => <SpendSliderDemo />,
};
