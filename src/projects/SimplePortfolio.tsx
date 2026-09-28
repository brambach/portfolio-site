import { useEffect, type CSSProperties } from 'react';
import { archive, projects, type Project } from './catalog';
import { email } from '../lib/site';
import './simple.css';

const covers: Partial<Record<Project['id'], string>> = {
  agentsky: '/project-lab/sky.png',
  dervo: '/projects/dervo/decision.png',
  lucid: '/projects/lucid/spec.png',
  arro: '/projects/arro/today-sample.png',
  'integration-portal': '/projects/portal/hub.png',
};

// small alternating tilts so the grid feels pinned up, not printed
const tilts = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];

export default function SimplePortfolio() {
  useEffect(() => {
    const title = document.title;
    document.title = 'Work / Bryce Rambach';
    return () => { document.title = title; };
  }, []);
  return <main className="sp-page" aria-label="Bryce Rambach's work">
    <header className="sp-nav">
      <span className="sp-nav__name">Bryce Rambach</span>
      <a href="/">Take the scenic route <span aria-hidden="true">→</span></a>
    </header>

    <section className="sp-hero">
      <h1>Hi, I’m Bryce.<br/><em>I design and build software you can feel.</em></h1>
      <p>Interfaces, systems and small rituals. Here’s what I’ve been making.</p>
    </section>

    <section className="sp-grid" aria-label="Selected work">
      {projects.map((project, i) => <a key={project.id} className="sp-card" href={`/projects/${project.id}`} style={{ '--tilt': `${tilts[i % tilts.length]}deg` } as CSSProperties} aria-label={`${project.name}: ${project.line}`}>
        <div className={`sp-card__art sp-card__art--${project.id}`} aria-hidden="true">
          {covers[project.id] ? <img src={covers[project.id]} alt="" loading="lazy"/> : <span className="sp-card__line"/>}
        </div>
        <div className="sp-card__text">
          <span className="sp-card__tag">{project.category}</span>
          <h2>{project.name}</h2>
          <p>{project.line}</p>
          <span className="sp-card__status">{project.status}</span>
        </div>
      </a>)}
    </section>

    <section className="sp-more" aria-labelledby="sp-more-title">
      <h2 id="sp-more-title">Also in the drawer</h2>
      <ul>{archive.map(item => <li key={item.name}><strong>{item.name}</strong><span>{item.kind}</span></li>)}</ul>
    </section>

    <footer className="sp-foot">
      <p>Want to make something together?</p>
      <a className="sp-foot__hello" href={`mailto:${email}`}>Say hello</a>
      <a href="/">Or open the Porsche <span aria-hidden="true">→</span></a>
    </footer>
  </main>;
}
