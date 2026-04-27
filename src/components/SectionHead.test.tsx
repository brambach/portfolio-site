import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionHead } from './SectionHead';

describe('SectionHead', () => {
  it('renders the section number, title, and description', () => {
    render(
      <SectionHead
        num="01 / Archive"
        title={<>Selected artifacts<br />from the workbench.</>}
        description="// Four production systems."
        headingId="arch-h"
      />,
    );
    expect(screen.getByText('01 / Archive')).toBeInTheDocument();
    expect(screen.getByText('// Four production systems.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 }).id).toBe('arch-h');
  });
});
