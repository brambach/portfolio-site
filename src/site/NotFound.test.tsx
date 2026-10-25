import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NotFound from './NotFound';
import SiteApp from './SiteApp';

describe('the not-found page', () => {
  it('says so, and has a way home and a way to the work', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nothing here.');
    expect(screen.getByRole('link', { name: /Back to the home page/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /See the work/ })).toHaveAttribute('href', '/#work');
    expect(document.title).toBe('not found, bryce rambach');
  });

  it('is what the site shows for an address it doesn’t know', async () => {
    render(<SiteApp route={{ name: 'missing' }} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Nothing here.' })).toBeInTheDocument();
  });
});
