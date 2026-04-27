import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TiltCard } from './TiltCard';

describe('TiltCard', () => {
  it('renders children', () => {
    render(<TiltCard><span>tilt me</span></TiltCard>);
    expect(screen.getByText('tilt me')).toBeInTheDocument();
  });

  it('updates --mx and --my on pointer move', () => {
    const { container } = render(<TiltCard><span>x</span></TiltCard>);
    const wrapper = container.firstChild as HTMLElement;
    wrapper.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    fireEvent.pointerMove(wrapper, { clientX: 50, clientY: 50, pointerType: 'mouse' });
    expect(wrapper.style.getPropertyValue('--mx')).toBe('50%');
    expect(wrapper.style.getPropertyValue('--my')).toBe('50%');
  });

  it('resets transform on pointer leave', () => {
    const { container } = render(<TiltCard><span>x</span></TiltCard>);
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.pointerLeave(wrapper);
    expect(wrapper.style.transform).toBe('');
  });
});
