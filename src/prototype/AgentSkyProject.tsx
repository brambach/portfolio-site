import {trackJourney} from '../lib/journey-stats';
import {useEffect} from 'react';
import {email} from '../lib/site';
import './agent-sky-project.css';

const screens=[
  {id:'01 / Session',title:'Choose an agent. Follow the task.',text:'A single workspace keeps the request, progress and sample files together. Changing agents cancels the pending demonstration, so an old run can’t finish under a new selection.',image:'session',alt:'Completed sample session with task steps and a Files tab listing three illustrative project files.',caption:'The sample run reaches Completed; the Files tab reveals its illustrative output.'},
  {id:'02 / Continuity',title:'Make the handoff visible.',text:'Layered local and cloud windows show which context carries over. Visitors can move the sample workspace, close the local session and reopen it. The transition explains continuity without relying on a paragraph of infrastructure terminology.',image:'cloud',alt:'A local terminal layered behind an active cloud workspace containing instructions, workspace files and session history.',caption:'Simulated workspace transfer. No files leave the visitor’s computer.'},
  {id:'03 / Comparison',title:'Give each result room to be read.',text:'One full-size preview sits beside the agent selector. Switching examples changes the changelog design; filters and an expanded preview let visitors inspect the interface rather than judge a tiny thumbnail.',image:'comparison',alt:'Codex selected in a three-example comparison beside a readable product-changelog preview.',caption:'Three handcrafted examples. This comparison isn’t a model benchmark.'},
];

export default function AgentSkyProject(){
  useEffect(()=>{trackJourney('project_study_opened');const previous=document.title;document.title='AgentSky · Bryce Rambach';return()=>{document.title=previous;};},[]);
  return <main className="case-study">
    <a className="case-study__skip" href="#study">Skip to the design study</a>
    <header className="case-study__nav"><a href="/projects">← All projects</a><a href={`mailto:${email}`}>Work with Bryce ↗</a></header>
    <article id="study">
      <div className="case-study__intro">
        <p className="case-study__eyebrow">Independent design study · September 2026</p>
        <h1>AgentSky.</h1>
        <p className="case-study__lead">An agent platform, explained through interaction.</p>
        <p className="case-study__summary">A homepage concept that lets visitors explore an agent session, follow a workspace into the cloud and compare sample outputs.</p>
        <dl className="case-study__facts"><div><dt>Contribution</dt><dd>Interface design & implementation</dd></div><div><dt>Built with</dt><dd>React, TypeScript & Motion</dd></div><div><dt>Status</dt><dd>Interactive concept</dd></div></dl>
      </div>
      <figure><img width={1253} height={705} src="/images/projects/agentsky/hero.jpg" alt="AgentSky homepage concept with a blue sky, a large product headline and the beginning of its session playground." fetchPriority="high"/><figcaption>Current implementation capture. Sky imagery was generated for the concept.</figcaption></figure>
      <section className="case-study__section case-study__opening"><p className="case-study__eyebrow">The design question</p><div><h2>Show what a persistent workspace means.</h2><p>Switching agents and keeping context are abstract ideas until there’s a workspace to look at. This study uses one sample task, building a product changelog, to connect the homepage’s explanations to visible interface states.</p><p className="case-study__limit">This is an independent study, not commissioned AgentSky work. Runs, files and outputs are simulated. The concept doesn’t call AgentSky or execute agent workloads.</p></div></section>
      {screens.map(screen=><section key={screen.id} className="case-study__section"><div className="case-study__section-heading"><span>{screen.id}</span><h2>{screen.title}</h2><p>{screen.text}</p></div><figure><img width={1253} height={705} loading="lazy" src={`/images/projects/agentsky/${screen.image}.jpg`} alt={screen.alt}/><figcaption>{screen.caption}</figcaption></figure></section>)}
      <section className="case-study__section case-study__closing"><div><p className="case-study__eyebrow">What this demonstrates</p><h2>A product story visitors can try.</h2><p>The implementation connects visual design to selection, progress, interruption and inspection states. Keyboard access and a reduced-motion path are part of those interactions.</p><p>No adoption, conversion or production-integration results are claimed. The screens above document a working interface concept.</p></div><a href={`mailto:${email}`}>Have a product that needs explaining?<br/><strong>Let’s talk ↗</strong></a></section>
    </article>
    <footer className="case-study__nav"><a href="/projects">← All projects</a><a href="/">Take the scenic route ↗</a></footer>
  </main>;
}
