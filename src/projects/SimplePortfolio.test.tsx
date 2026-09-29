import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SimplePortfolio from './SimplePortfolio';
import { projects } from './catalog';

const onTheRoad = projects.filter(project => project.id !== 'agentsky');

describe('SimplePortfolio', () => {
  it('puts every project but AgentSky on the road, each opening its study', () => {
    render(<SimplePortfolio />);
    for (const project of onTheRoad) {
      expect(screen.getByRole('link', { name: `${project.name}: ${project.line}` })).toHaveAttribute('href', `/projects/${project.id}`);
    }
  });

  it('leads with Dervo and links to its site', () => {
    render(<SimplePortfolio />);
    const links = screen.getAllByRole('link', { name: /: / });
    expect(links[0]).toHaveAccessibleName(/^Dervo: /);
    expect(screen.getByRole('link', { name: /trydervo\.com/ })).toHaveAttribute('href', 'https://trydervo.com');
  });

  it('lets you answer the example question on Dervo’s Catch up card', () => {
    render(<SimplePortfolio />);
    const card = screen.getByRole('group', { name: 'Dervo Catch up, example project' });
    // the card only offers Answer once the car has arrived; before that every thread is still running
    expect(within(card).getAllByText('Running…')).toHaveLength(3);
    expect(within(card).queryByRole('button', { name: 'Answer' })).toBeNull();
  });

  it('keeps AgentSky in the glovebox', () => {
    render(<SimplePortfolio />);
    const glovebox = screen.getByRole('heading', { name: 'Also in the glovebox' }).closest('section') as HTMLElement;
    expect(within(glovebox).getByRole('link', { name: /AgentSky/ })).toHaveAttribute('href', '/projects/agentsky');
  });

  it('passes the 3D drive’s stops in its order: café, courts, the work, then the lake', () => {
    const { container } = render(<SimplePortfolio />);
    const text = container.querySelector('.sp-track')!.textContent!;
    const at = (words: string) => text.indexOf(words);
    expect(at('The long way')).toBeGreaterThan(-1);
    expect(at('The long way')).toBeLessThan(at('Tennis club'));
    expect(at('Young prodigy')).toBeLessThan(at('Dervo'));
    expect(at('Port')).toBeLessThan(at('Yes, this counts as looking at my site'));
  });

  it('ends the drive with a way into the 3D Porsche', () => {
    render(<SimplePortfolio />);
    expect(screen.getByRole('link', { name: /take the wheel/i })).toHaveAttribute('href', '/?from=work');
  });

  it('keeps the moving headline readable as one heading', () => {
    render(<SimplePortfolio />);
    expect(screen.getByRole('heading', { level: 1, name: 'Hi, I’m Bryce. I design and build software you can feel.' })).toBeInTheDocument();
  });
});

