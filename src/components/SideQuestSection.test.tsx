import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SideQuestSection } from './SideQuestSection';

describe('SideQuestSection', () => {
  it('renders the section heading and concept copy', () => {
    render(<SideQuestSection onOpen={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/SideQuest/i);
    expect(screen.getByText(/real-world\s+intent/i)).toBeInTheDocument();
  });

  it('clicking OPEN CONCEPT DOSSIER calls onOpen with sidequest slug', async () => {
    const onOpen = vi.fn();
    render(<SideQuestSection onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: /open concept dossier/i }));
    expect(onOpen).toHaveBeenCalledWith('sidequest');
  });
});
