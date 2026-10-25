import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PORTAL } from '../copy';
import { DervoLayout } from './DervoStill';
import { MOCK } from './dervo-script';
import { PortalLayout } from './PortalStill';

/* What a screen reader hears from the two mocks: each one's long description once, and none of the sample app's
   own words. */

describe('The dervo windows to a screen reader', () => {
  it.each(['lite', 'still', 'full'] as const)('describe the sample app once in %s', mode => {
    const { container } = render(<DervoLayout mode={mode} label={MOCK.label} screen={() => <p>sample words</p>} />);
    expect(screen.getAllByRole('img', { name: MOCK.label })).toHaveLength(mode === 'still' ? 2 : 1);
    // Every other window is hidden, so its sample words never reach the reader.
    container.querySelectorAll('.dv__screen:not([role="img"])').forEach(w => expect(w).toHaveAttribute('aria-hidden', 'true'));
    screen.getAllByText('sample words').forEach(p => expect(p.closest('[role="img"], [aria-hidden="true"]')).not.toBeNull());
  });

  it('puts the description on the first phone frame', () => {
    const { container } = render(<DervoLayout mode="lite" label={MOCK.label} />);
    const frames = container.querySelectorAll('.dv__frame .dv__screen');
    expect(frames).toHaveLength(6);
    expect(frames[0]).toHaveAttribute('aria-label', MOCK.label);
  });
});

describe('The portal mock to a screen reader', () => {
  it.each(['lite', 'still', 'full'] as const)('is one picture with one description in %s', mode => {
    render(<PortalLayout mode={mode} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAccessibleName(PORTAL.art);
  });
});
