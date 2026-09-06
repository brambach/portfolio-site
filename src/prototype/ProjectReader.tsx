import {ContactLinks} from './ContactLinks';
import { ProjectLaptop } from './ProjectLaptop';
import './live-entrance.css';
import './project-reader.css';
import './cabin-objects.css';

export default function ProjectReader() {
  return <main className="project-reader" aria-label="Bryce Rambach's personal portfolio">
    <header className="project-reader__header"><a href="/">← Back to the Porsche</a><a href="mailto:bryce.rambach@gmail.com">Say hello ↗</a></header>
    <section className="project-reader__intro" aria-label="About Bryce"><h1>Bryce Rambach.</h1><p>I build software, connect systems, and make little tools for the people around me.</p><p>At the consultancy, I work across payroll, HR, and finance with an integration platform, a payroll system, a rostering system, and the finance system.</p></section>
    <section className="project-reader__pages" aria-label="Personal projects"><ProjectLaptop /></section>
    <footer className="project-reader__footer"><span>Bryce Rambach. Designer & engineer.</span><a href="https://github.com/brambach" target="_blank" rel="noreferrer">GitHub ↗</a><ContactLinks/></footer>
  </main>;
}
