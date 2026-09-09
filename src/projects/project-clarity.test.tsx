import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, expect, it } from 'vitest';
import { ProjectCollection, getArchiveAvailabilityLabel } from './ProjectCollection';
import { archive, type ArchiveItem } from './catalog';
import DervoStudy from './DervoStudy';
import ArroStudy from './ArroStudy';
import LucidStudy from './LucidStudy';
import PortalStudy from './PortalStudy';
import { Screening } from '../project-lab/ProjectLab';

beforeAll(() => {
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
});

it('places the AgentSky recording boundary beside the first sample action', () => {
  render(<Screening />);
  const sampleSection = screen.getByRole('button', { name: /Watch the film/i }).closest('section');
  expect(sampleSection).not.toBeNull();
  expect(within(sampleSection as HTMLElement).getByText("Recorded from an illustrative prototype. AgentSky’s service and agent execution aren't connected.")).toBeInTheDocument();
});

it('places the Dervo fixture boundary beside the first sample decision', () => {
  render(<DervoStudy />);
  const sampleSection = screen.getByRole('region', { name: 'Dervo sample decision' });
  expect(within(sampleSection).getByText('Local prototype. Screens show the app-v3 design experiment with fixture receipts, model labels and outcomes.')).toBeInTheDocument();
});

it('places Lucid fixture confidence language beside the first brief and selected mapping fields', async () => {
  const user = userEvent.setup();
  render(<LucidStudy />);
  const sampleSection = screen.getByRole('region', { name: 'Lucid sample specification' });
  expect(within(sampleSection).getByText(/Verified, researched and inferred are fixture labels, not checks performed by this portfolio/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Inspect a field/i }));
  const mappingSection = screen.getByText('Source → Destination').closest('.ps-lucid__mapping');
  expect(mappingSection).not.toBeNull();
  expect(within(mappingSection as HTMLElement).getByText('Verified, researched and inferred are fixture labels, not checks performed by this portfolio.')).toBeInTheDocument();
});

it('places the Arro sample-activity boundary beside the opening phone frame', () => {
  render(<ArroStudy />);
  const sampleSection = screen.getByText(/A small reason to show up/i).closest('header');
  expect(sampleSection).not.toBeNull();
  expect(within(sampleSection as HTMLElement).getByText('Prototype with sample activity. Names and initials are fictional.')).toBeInTheDocument();
});

it('places the portal employer-owned fiction boundary beside the first mapping task', () => {
  render(<PortalStudy />);
  const task = screen.getByText('One mapping needs your eye.').closest('.ps-portal__task');
  expect(task).not.toBeNull();
  expect(within(task as HTMLElement).getByText('Employer-owned work. All screens are redrawn with a fictional cast.')).toBeInTheDocument();
});

it('computes archive availability from item metadata and uses it in the summary', () => {
  render(<ProjectCollection open={() => {}} />);
  const label = getArchiveAvailabilityLabel(archive);
  expect(label).toMatch(/^\d+ recordings, \d+ source or concept notes$/);
  expect(label).not.toContain('2/8');
  expect(screen.getByText(label)).toBeInTheDocument();

  const fixture: ArchiveItem[] = [
    { name: 'Film one', kind: 'Recording', availability: 'recording', recordingId: 'crypto', text: 'Historical recording survives.' },
    { name: 'Source only', kind: 'Source', availability: 'source-note', text: 'Source survives.' },
    { name: 'Private note', kind: 'Private', availability: 'withheld-note', text: 'Private records withheld.' },
  ];
  expect(getArchiveAvailabilityLabel(fixture)).toBe('1 recordings, 2 source or concept notes');
});

it('uses archive metadata to decide which records expose playback', async () => {
  const user = userEvent.setup();
  render(<ProjectCollection open={() => {}} />);
  await user.click(screen.getByText(/From the archive/i));

  for (const item of archive) {
    const article = screen.getByRole('article', { name: item.name });
    const filmButton = within(article).queryByRole('button', { name: new RegExp(`Watch ${item.name} archive film`, 'i') });
    expect(Boolean(filmButton), item.name).toBe(item.availability === 'recording');
  }
});

it('renders archive playback from fixture metadata instead of production totals', async () => {
  const user = userEvent.setup();
  const items: ArchiveItem[] = [
    { name: 'Fixture recording', kind: 'Recovered film', availability: 'recording', recordingId: 'crypto', text: 'A recording survives.' },
    { name: 'Fixture note', kind: 'Source note', availability: 'source-note', text: 'Only source notes survive.' },
  ];
  render(<ProjectCollection open={() => {}} archiveItems={items} />);
  await user.click(screen.getByText(/From the archive/i));

  expect(screen.getByText('1 recordings, 1 source or concept notes')).toBeInTheDocument();
  expect(within(screen.getByRole('article', { name: 'Fixture recording' })).getByRole('button', { name: 'Watch Fixture recording archive film' })).toBeInTheDocument();
  expect(within(screen.getByRole('article', { name: 'Fixture note' })).queryByRole('button')).toBeNull();
});

it('keeps collection heading ids unique when compact and full-size collections render together', () => {
  render(<><ProjectCollection compact open={() => {}}/><ProjectCollection open={() => {}}/></>);
  const ids = [...document.querySelectorAll<HTMLElement>('[id]')].map(element => element.id);
  expect(ids.length).toBeGreaterThan(0);
  expect(new Set(ids).size).toBe(ids.length);
});
