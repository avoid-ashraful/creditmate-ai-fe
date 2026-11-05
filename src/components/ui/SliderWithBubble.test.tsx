import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import SliderWithBubble from './SliderWithBubble';

describe('SliderWithBubble', () => {
  it('exposes the formatted value to assistive technology and in the bubble', () => {
    render(
      <SliderWithBubble
        value={50000}
        min={10000}
        max={500000}
        step={10000}
        onChange={() => undefined}
        formatValue={value => `Tk ${value}`}
        ariaLabel="Monthly spend"
      />
    );
    const slider = screen.getByLabelText('Monthly spend');
    expect(slider).toHaveAttribute('aria-valuetext', 'Tk 50000');
    expect(screen.getByText('Tk 50000', { selector: '.cm-slider-bubble' })).toBeInTheDocument();
  });

  it('reports changes as numbers', () => {
    const onChange = jest.fn();
    render(
      <SliderWithBubble
        value={50000}
        min={10000}
        max={500000}
        step={10000}
        onChange={onChange}
        formatValue={value => String(value)}
        ariaLabel="Monthly spend"
      />
    );
    fireEvent.change(screen.getByLabelText('Monthly spend'), { target: { value: '60000' } });
    expect(onChange).toHaveBeenCalledWith(60000);
  });
});
