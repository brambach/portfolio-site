import { describe, expect, it } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Nav } from './Nav';

describe('Nav', () => {
  it('renders the logomark as a link to #hero', () => {
    render(<Nav />);
    const logo = screen.getByRole('link', { name: /Bryce Rambach/i });
    expect(logo).toHaveAttribute('href', '#hero');
  });

  it('renders the four section links', () => {
    render(<Nav />);
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '#projects');
    expect(screen.getByRole('link', { name: /AI & Tools/i })).toHaveAttribute('href', '#stack');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '#contact');
  });

  it('renders the Résumé CTA', () => {
    render(<Nav />);
    const resume = screen.getAllByRole('link', { name: /Résumé/i })[0];
    expect(resume).toHaveAttribute('href', '/Bryce_Rambach_Resume.pdf');
    expect(resume).toHaveAttribute('target', '_blank');
  });

  it('has a primary navigation landmark', () => {
    render(<Nav />);
    expect(screen.getByRole('navigation', { name: /Primary/i })).toBeInTheDocument();
  });
});

describe('Nav scroll-spy', () => {
  it('marks the Projects link active when the projects section intersects', () => {
    // Stub IntersectionObserver to capture the callback
    let capturedCallback: IntersectionObserverCallback | null = null;
    const observeCalls: Element[] = [];
    class FakeIO implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [];
      constructor(cb: IntersectionObserverCallback) {
        capturedCallback = cb;
      }
      observe(el: Element) { observeCalls.push(el); }
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] { return []; }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = FakeIO;

    // Render Nav + fake section anchors so the observer can find them
    const projectsSection = document.createElement('section');
    projectsSection.id = 'projects';
    document.body.appendChild(projectsSection);
    const workSection = document.createElement('section');
    workSection.id = 'work';
    document.body.appendChild(workSection);

    render(<Nav />);

    // Fire a fake intersection on #projects
    act(() => {
      capturedCallback?.(
        [{ target: projectsSection, isIntersecting: true, intersectionRatio: 0.6 } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    const projectsLink = screen.getByRole('link', { name: 'Projects' });
    expect(projectsLink.getAttribute('data-active')).toBe('true');

    document.body.removeChild(projectsSection);
    document.body.removeChild(workSection);
  });
});
