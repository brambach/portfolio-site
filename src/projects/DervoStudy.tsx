import { useState } from 'react';
import { InspectImage } from './InspectImage';
const boundary='Private beta. Screens show example projects from the design review and the landing page, not a tester’s work.';
const scenes=[
  {name:'Catch up',file:'catch-up',heading:'Come back to a few sentences.',text:'Catch up says what finished, what’s stuck and what needs you since you last looked. Answer one question and the thread carries on.'},
  {name:'The record',file:'thread',heading:'It reads the record, not the agent’s account.',text:'Every run ends with what changed, what was checked, what wasn’t, and what’s next. Approving it commits the work.'},
  {name:'The site',file:'sunrise',heading:'A sunrise that rises as the run goes.',text:'The landing page rebuilds the product in HTML, over a dotted sunrise drawn in a shader. It echoes the progress dot in the app.'},
];
export default function DervoStudy(){
  const [step,setStep]=useState(0);const [handedOff,setHandedOff]=useState(false);
  const scene=scenes[step];
  return <article className="ps-dervo">
    <header className="ps-dervo__hero"><span className="ps-eyebrow">Dervo / Mac app, private beta</span><div><h1 tabIndex={-1}>Run more agents<br/><em>than you can watch.</em></h1><p>Claude Code and Codex, side by side on your Mac.<br/>Come back to what finished, what’s stuck and what needs you.</p></div><div className="ps-dervo__signal"><span>Running</span><i/><span>Finished</span><i/><span className="is-waiting">Needs you</span></div></header>
    <section className="ps-dervo__sequence" aria-label="Dervo sample catch up"><div className="ps-sequence-nav">{scenes.map((item,index)=><button key={item.name} aria-pressed={step===index} onClick={()=>setStep(index)}><small>0{index+1}</small>{item.name}</button>)}<span>Example projects</span></div>
      <div className="ps-dervo__screen"><img src={`/projects/dervo/${scene.file}.jpg`} alt={`Dervo: ${scene.heading}`}/></div>
      <div className="ps-dervo__caption" aria-live="polite"><div><span className="ps-eyebrow">0{step+1} / 03</span><h2>{scene.heading}</h2></div><p>{scene.text}</p><p className="ps-sample-note">{boundary}</p><InspectImage src={`/projects/dervo/${scene.file}.jpg`} alt={`Dervo ${scene.name.toLowerCase()} screen`}/></div>
      <div className="ps-dervo__decision"><div><span className="ps-eyebrow">Try the handoff</span><p>{handedOff?'Codex picked up where Claude stopped. Three of five files were already changed, so it carried on from there.':'Connector picker stopped at Claude’s usage limit, halfway through.'}</p></div><button onClick={()=>setHandedOff(!handedOff)}>{handedOff?'Reset the example':'Continue in Codex'} <span aria-hidden="true">→</span></button><small>An example thread. Nothing runs from this page.</small></div>
    </section>
    <section className="ps-editorial"><span className="ps-eyebrow">The product idea</span><h2>Less watching.<br/>More knowing.</h2><p>Coding agents can work for hours, and people run several at once. The hard part stopped being the typing and became keeping track. Dervo gives you one place to come back to: what finished, what’s stuck and the one question that needs you.</p><div className="ps-editorial__pair"><div><span className="ps-eyebrow">Design</span><h3>Status from what happened.</h3><p>Catch up is written from the record of each run on your Mac, not from the agent’s account of itself. Threads name and file themselves, and the interface keeps one accent per view so what needs you stands out.</p></div><div><span className="ps-eyebrow">Engineering</span><h3>Two agents, one thread.</h3><p>A Tauri shell in Rust with signed, notarized releases and signed updates. A React interface and a Python backend run Claude Code and Codex, queue parallel work, and hand a thread to the other agent when one hits its limit.</p></div></div></section>
    <footer className="ps-study-footer"><div>Founder: product design, the Mac app, its backend and the website<br/>Bryce Rambach</div><p>{boundary} Parts of the app began from the open-source Buzz project.</p><p><a href="https://trydervo.com" target="_blank" rel="noreferrer">trydervo.com</a></p></footer>
  </article>;
}
