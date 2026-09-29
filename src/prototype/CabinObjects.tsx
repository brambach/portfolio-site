import {ContactLinks} from './ContactLinks';
import { useEffect, useRef } from 'react';
import { ProjectLaptop } from './ProjectLaptop';

export type CabinObject = 'laptop' | 'journal' | 'card' | 'racket';
export function CabinObjects({ object, close, physical = false, nextLabel }: { nextLabel?: string; object: CabinObject; close: () => void; physical?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef(document.activeElement);
  useEffect(() => {
    const element = dialog.current!;
    const previous = previousFocus.current;
    element.showModal();
    return () => {
      requestAnimationFrame(() => {
      // someone already moved focus on (the horn, a card): leave it there
      const active = document.activeElement;
      if (active instanceof HTMLElement && active !== document.body && active.isConnected && !element.contains(active)) return;
      const target = previous instanceof HTMLElement && previous.isConnected && previous !== document.body
        ? previous
        : document.querySelector<HTMLElement>(".live-entrance__scene canvas");
      target?.focus({ preventScroll: true });
      });
    };
  }, []);
  return <dialog ref={dialog} className={`cabin-object cabin-object--${object} ${physical && (object === 'racket' || object === 'card') ? `cabin-object--physical-${object}` : ''}`} onClose={close} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-label={object === 'laptop' ? 'Project laptop' : object === 'journal' ? 'Field notes' : object === 'racket' ? 'Tennis racket' : 'Contact card'}>
    <div className="cabin-object__surface">
      {object !== 'laptop' && <header className="cabin-object__bar"><span>{object === 'journal' ? 'Off the clock' : object === 'racket' ? 'Tennis' : 'A note from the glovebox'}</span><button onClick={close} aria-label="Put down object">×</button></header>}
      {object === 'laptop' && <ProjectLaptop close={close} />}
      {object === 'racket' && <article className="tennis-note"><h1>On the court.</h1><p>I played tennis when I was younger.</p><p className="tennis-note__nickname">They call me<br/><span>the young prodigy.</span></p></article>}
      {object === 'journal' && <div className="field-notes"><h1>Things worth keeping.</h1><div className="field-notes__photos">{[['clay-court','Clay courts'],['meadow-trail','Early miles'],['snowboard-dusk','Winter, occasionally'],['city-dusk','City lights']].map(([file, caption],index) => <figure key={file} className={`field-print field-print--${index}`}><img src={`/images/${file}.jpg`} alt={caption}/><figcaption>{caption}</figcaption></figure>)}</div><span className="field-notes__pencil">a little time away from the screen</span></div>}
      {object === 'card' && <article className="contact-note"><span className="cabin-eyebrow">Designer & engineer</span><h1>Bryce Rambach.</h1><a href="mailto:bryce.rambach@gmail.com">bryce.rambach@gmail.com ↗</a><ContactLinks socialsOnly/><p>I build software, connect systems, and make little tools for the people around me.</p><p>At Digital Directions, I work across payroll, HR, and finance with Workato, MYOB, Deputy, and NetSuite.</p></article>}
      {nextLabel && <footer className="cabin-tour-footer"><span>{object === 'card' ? 'BEFORE WE GO' : 'A LITTLE ABOUT ME'}</span><button className="cabin-tour-next" onClick={close}>{nextLabel}<span aria-hidden="true">↗</span></button></footer>}
    </div>
  </dialog>;
}
