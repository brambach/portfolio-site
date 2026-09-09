import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {act,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {RoadNotes} from './RoadNotes';
beforeEach(()=>sessionStorage.clear());
afterEach(()=>vi.unstubAllGlobals());
function setMobileViewport(matches:boolean){
 vi.stubGlobal('matchMedia',vi.fn((query:string)=>({
  matches,
  media:query,
  onchange:null,
  addEventListener:vi.fn(),
  removeEventListener:vi.fn(),
  addListener:vi.fn(),
  removeListener:vi.fn(),
  dispatchEvent:vi.fn()
 })));
}
// A live stub, so a test can actually cross the 700px boundary the way a
// rotated phone or a resized window does.
function resizableViewport(matches:boolean){
 const listeners=new Set<()=>void>();
 const query={
  get matches(){return matches;},
  media:'(max-width:700px)',
  onchange:null,
  addEventListener:(_:string,listener:()=>void)=>{listeners.add(listener);},
  removeEventListener:(_:string,listener:()=>void)=>{listeners.delete(listener);},
  addListener:vi.fn(),
  removeListener:vi.fn(),
  dispatchEvent:vi.fn()
 };
 vi.stubGlobal('matchMedia',vi.fn(()=>query));
 return {resize(next:boolean){matches=next;act(()=>{for(const listener of listeners)listener();});}};
}
// The narrow note starts closed, so a mobile test that wants the full card has
// to open it the way a reader does.
async function openNarrowNote(user:ReturnType<typeof userEvent.setup>){
 await user.click(screen.getByRole('button',{name:/a little about bryce/i}));
}
it('keeps an expanded note in place as the car moves',async()=>{
 const user=userEvent.setup();
 const view=render(<RoadNotes progress={0}/>);
 await user.click(screen.getByRole('button',{name:'A little more'}));
 view.rerender(<RoadNotes progress={.5}/>);
 expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Next note about Bryce'}));
 expect(screen.getByRole('heading',{name:'My day job connects systems.'})).toBeInTheDocument();
});
it('keeps notes dismissed when the journey resumes after a stop',async()=>{
 const user=userEvent.setup();
 const view=render(<RoadNotes progress={0}/>);
 await user.click(screen.getByRole('button',{name:'Hide drive notes'}));
 view.unmount();render(<RoadNotes progress={.5}/>);
 expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});
it('keeps the note state live while yielding visual priority to a stop card',async()=>{
 const user=userEvent.setup();
 const view=render(<RoadNotes progress={0} deferred/>);
 expect(screen.getByRole('complementary',{name:'A little about Bryce'})).toHaveClass('is-deferred');
 await user.click(screen.getByRole('button',{name:'A little more'}));
 view.rerender(<RoadNotes progress={.5} deferred/>);
 expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Hide drive notes'}));
 view.rerender(<RoadNotes progress={.5} deferred/>);
 expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});
it('hides deferred notes on mobile while preserving the live note state',async()=>{
 setMobileViewport(true);
 const user=userEvent.setup();
 const view=render(<RoadNotes progress={0}/>);
 await openNarrowNote(user);
 await user.click(screen.getByRole('button',{name:'A little more'}));
 view.rerender(<RoadNotes progress={.5} deferred/>);
 expect(screen.queryByRole('complementary',{name:'A little about Bryce'})).not.toBeInTheDocument();
 const deferredNote=view.container.querySelector('.road-notes');
 expect(deferredNote).not.toBeNull();
 expect(deferredNote).toHaveClass('is-mobile-deferred');
 expect(deferredNote).toHaveAttribute('aria-hidden','true');
 expect(deferredNote).toHaveAttribute('inert');
 view.rerender(<RoadNotes progress={.5}/>);
 expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
 expect(screen.getByText('The laptop brings those sides together: interface studies, desktop tools, mobile prototypes and integration work. Each project has something you can explore.')).toBeInTheDocument();
});
it('captures note focus ownership before mobile hiding can clear activeElement',()=>{
 setMobileViewport(true);
 const onFocusHidden=vi.fn();
 const view=render(<><RoadNotes progress={0} onFocusHidden={onFocusHidden}/><button>Elsewhere</button></>);
 const more=screen.getByRole('button',{name:/a little about bryce/i});
 fireEvent.focus(more);
 const activeElement=vi.spyOn(document,'activeElement','get').mockReturnValue(document.body);
 view.rerender(<><RoadNotes progress={.5} deferred onFocusHidden={onFocusHidden}/><button>Elsewhere</button></>);
 expect(onFocusHidden).toHaveBeenCalledOnce();
 activeElement.mockRestore();
});
it('does not use stale note focus ownership after focus leaves the note',()=>{
 setMobileViewport(true);
 const onFocusHidden=vi.fn();
 const view=render(<><RoadNotes progress={0} onFocusHidden={onFocusHidden}/><button>Elsewhere</button></>);
 const more=screen.getByRole('button',{name:/a little about bryce/i});
 const elsewhere=screen.getByRole('button',{name:'Elsewhere'});
 fireEvent.focus(more);
 fireEvent.blur(more,{relatedTarget:elsewhere});
 fireEvent.focus(elsewhere);
 const activeElement=vi.spyOn(document,'activeElement','get').mockReturnValue(document.body);
 view.rerender(<><RoadNotes progress={.5} deferred onFocusHidden={onFocusHidden}/><button>Elsewhere</button></>);
 expect(onFocusHidden).not.toHaveBeenCalled();
 activeElement.mockRestore();
});
it('starts a narrow note as a compact peek and opens the whole note on demand',async()=>{
 setMobileViewport(true);
 const user=userEvent.setup();
 const view=render(<RoadNotes progress={0}/>);
 const toggle=screen.getByRole('button',{name:/a little about bryce/i});
 expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(view.container.querySelector('.road-notes')).toHaveClass('is-compact');
 // Closed, the note carries its place in the series and the title only.
 expect(screen.getByText('BETWEEN STOPS / 01')).toBeInTheDocument();
 expect(screen.queryByText('Interfaces, connected systems, and little tools for the people around me.')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'A little more'})).not.toBeInTheDocument();
 // The dismiss stays reachable without opening anything.
 expect(screen.getByRole('button',{name:'Hide drive notes'})).toBeInTheDocument();
 await user.click(toggle);
 expect(toggle).toHaveAttribute('aria-expanded','true');
 expect(view.container.querySelector('.road-notes')).not.toHaveClass('is-compact');
 expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
 expect(screen.getByText('Interfaces, connected systems, and little tools for the people around me.')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'A little more'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Next note about Bryce'})).toBeInTheDocument();
 expect(toggle.getAttribute('aria-controls')).toBe(view.container.querySelector('.road-notes__body')?.id);
 await user.click(toggle);
 expect(screen.queryByRole('heading',{name:'I design and build software.'})).not.toBeInTheDocument();
});
it('keeps a real disclosure target while the narrow note is closed',()=>{
 setMobileViewport(true);
 render(<RoadNotes progress={0}/>);
 const toggle=screen.getByRole('button',{name:/a little about bryce/i});
 const target=document.getElementById(toggle.getAttribute('aria-controls')!);
 expect(target).not.toBeNull();
 expect(target).toHaveAttribute('hidden');
});
it('keeps the narrow toggle focused while telemetry keeps arriving',()=>{
 setMobileViewport(true);
 const view=render(<RoadNotes progress={0}/>);
 const toggle=screen.getByRole('button',{name:/a little about bryce/i});
 toggle.focus();
 view.rerender(<RoadNotes progress={.18}/>);
 view.rerender(<RoadNotes progress={.32}/>);
 expect(document.activeElement).toBe(toggle);
 expect(screen.getByText('BETWEEN STOPS / 03')).toBeInTheDocument();
});
it('moves note focus to the surviving control when the viewport crosses the narrow boundary',()=>{
 const viewport=resizableViewport(true);
 render(<RoadNotes progress={0}/>);
 screen.getByRole('button',{name:/a little about bryce/i}).focus();
 // Widening removes the peek entirely, so the keyboard lands on the note's own
 // first action rather than on the document.
 viewport.resize(false);
 expect(screen.queryByRole('button',{name:/a little about bryce/i})).not.toBeInTheDocument();
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'A little more'}));
 expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
 viewport.resize(true);
 expect(document.activeElement).toBe(screen.getByRole('button',{name:/a little about bryce/i}));
});
it('leaves an open narrow note under the keyboard when the viewport widens',async()=>{
 const viewport=resizableViewport(true);
 const user=userEvent.setup();
 render(<RoadNotes progress={0}/>);
 await user.click(screen.getByRole('button',{name:/a little about bryce/i}));
 const more=screen.getByRole('button',{name:'A little more'});
 more.focus();
 viewport.resize(false);
 expect(document.activeElement).toBe(more);
 viewport.resize(true);
 expect(document.activeElement).toBe(more);
 expect(screen.getByRole('button',{name:/a little about bryce/i})).toHaveAttribute('aria-expanded','true');
});
it('gives first-use guidance on the narrow peek and retires it once the note has been opened',async()=>{
 setMobileViewport(true);
 const user=userEvent.setup();
 const first=render(<RoadNotes progress={0}/>);
 const hint=screen.getByText(/four short notes/i);
 expect(hint).toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:/a little about bryce/i}));
 expect(screen.queryByText(/four short notes/i)).not.toBeInTheDocument();
 first.unmount();
 render(<RoadNotes progress={.3}/>);
 expect(screen.queryByText(/four short notes/i)).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:/a little about bryce/i})).toHaveAttribute('aria-expanded','false');
});
it('leaves the wide note open with no peek in front of it',()=>{
 setMobileViewport(false);
 const view=render(<RoadNotes progress={0}/>);
 expect(view.container.querySelector('.road-notes')).not.toHaveClass('is-compact');
 expect(screen.queryByRole('button',{name:/a little about bryce/i})).not.toBeInTheDocument();
 expect(screen.getByRole('heading',{name:'I design and build software.'})).toBeInTheDocument();
});
it('keeps the compact narrow note out of the drive view',()=>{
 const css=readFileSync('src/prototype/road-notes.css','utf8');
 const compact=css.match(/@media\(max-width:700px\)\{[^@]*\.road-notes\.is-compact\{([^}]*)\}/);
 expect(compact?.[1]).toBeDefined();
 expect(compact?.[1]).toContain('width:auto');
 const maxHeight=compact?.[1].match(/max-height:(\d+)px/);
 expect(Number(maxHeight?.[1])).toBeLessThanOrEqual(96);
 const maxWidth=compact?.[1].match(/max-width:(\d+)px/);
 expect(Number(maxWidth?.[1])).toBeLessThanOrEqual(230);
});
it('keeps normal mobile notes below the driving HUD',()=>{
 const css=readFileSync('src/prototype/road-notes.css','utf8');
 const mobileRule=css.match(/@media\(max-width:700px\)\{\.road-notes\{([^}]*)\}/);
 expect(mobileRule?.[1]).toBeDefined();
 const top=mobileRule?.[1].match(/top:(\d+)px/);
 expect(Number(top?.[1])).toBeGreaterThanOrEqual(110);
 expect(css).toContain('.road-notes.is-mobile-deferred');
});
