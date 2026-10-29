/* Dervo's Home screen, rebuilt in HTML with example projects, so the project page can show it working: a request is
   typed, sent, and picked up by the Live board thread. CSS keyframes on a 12 second loop (cobalt.css), sized in
   container units so it scales with its frame. */

export default function DervoDemo({ label }: { label: string }) {
  return <div className="dv" role="img" aria-label={label}>
<div className="dv-grid">
<div className="dv-side">
<div style={{ display: 'flex', alignItems: 'center', gap: '.9cqw', marginBottom: '1.6cqw' }}><span style={{ width: '2.2cqw', height: '2.2cqw', borderRadius: '.5cqw', background: '#22382b', color: '#f7f6f3', display: 'grid', placeItems: 'center', fontSize: '1.3cqw' }}>d</span><span style={{ display: 'flex', flexDirection: 'column' }}><b>dervo app</b><span style={{ fontSize: '1cqw', color: '#6b6a64' }}>~/dervo/app</span></span></div>
<div className="it" style={{ borderRadius: '.6cqw', background: '#fff', boxShadow: '0 0 0 1px rgba(27,27,25,.08)', padding: '.8cqw' }}><b>Home</b><span>2</span></div>
<div className="it"><span>Knowledge</span><span>1</span></div>
<div className="it"><span>Next up</span></div>
<div style={{ padding: '1.2cqw .8cqw .4cqw', fontSize: '1.1cqw', color: '#6b6a64', fontWeight: '500' }}>Orchestrator</div>
<div className="it"><span style={{ display: 'flex', gap: '.7cqw', alignItems: 'center' }}><span className="dot" style={{ borderColor: '#b0461f' }} /><b>Ideas storage</b></span><span style={{ color: '#6b6a64' }}>1:52</span></div>
<div className="it"><span style={{ display: 'flex', gap: '.7cqw', alignItems: 'center' }}><span className="dot" /><b>Connector picker</b></span><span style={{ color: '#6b6a64' }}>2:14</span></div>
<div className="it"><span style={{ display: 'flex', gap: '.7cqw', alignItems: 'center' }}><span style={{ position: 'relative', width: '1cqw', height: '1cqw' }}><span className="dv-done" style={{ position: 'absolute', inset: '0', borderRadius: '50%', background: '#dfe7df' }} /><span className="dv-spin" style={{ position: 'absolute', inset: '0', borderRadius: '50%', border: '.18cqw solid #22382b', borderRightColor: 'transparent' }} /></span><b>Live board</b></span><span style={{ color: '#6b6a64' }}>3:40</span></div>
</div>
<div className="dv-main">
<p style={{ margin: '0', fontFamily: '\'Instrument Serif\',Georgia,serif', fontSize: '3.4cqw', lineHeight: '1' }}>Still up.</p>
<p style={{ margin: '.9cqw 0 0', color: '#6b6a64', fontSize: '1.1cqw' }}>Since 11:20 PM · 3 threads moved</p>
<p style={{ margin: '2cqw 0 0', lineHeight: '1.55', maxWidth: '44cqw' }}>Ideas storage has a question for you. Connector picker hit Claude's usage limit halfway. Live board finished and passed its checks.</p>
<div style={{ marginTop: '2.4cqw', display: 'flex', justifyContent: 'space-between', color: '#6b6a64', fontSize: '1.1cqw' }}><span>Waiting on you 2</span><span>Open in Catch up</span></div>
<div className="dv-row" style={{ margin: '1cqw -1.2cqw 0', padding: '1.1cqw 1.2cqw', borderRadius: '.8cqw', display: 'flex', justifyContent: 'space-between' }}><span style={{ display: 'flex', flexDirection: 'column', gap: '.4cqw' }}><b style={{ fontSize: '1.45cqw' }}>Ideas storage</b><span>Wants your review</span></span><span style={{ color: '#6b6a64' }}>1:52 AM</span></div>
<div style={{ padding: '1.1cqw 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ display: 'flex', flexDirection: 'column', gap: '.4cqw' }}><b style={{ fontSize: '1.45cqw' }}>Connector picker</b><span>Pick it up</span></span><span style={{ color: '#6b6a64' }}>2:14 AM</span></div>
<div style={{ position: 'absolute', left: '9cqw', right: '9cqw', bottom: '1.8cqw', borderRadius: '1.6cqw', background: '#fff', boxShadow: '0 0 0 1px rgba(27,27,25,.1),0 1cqw 2.4cqw -1.4cqw rgba(27,27,25,.25)', padding: '1.3cqw 1.6cqw', display: 'flex', flexDirection: 'column', gap: '1cqw' }}>
<div style={{ position: 'relative', height: '1.9cqw' }}><span className="dv-ph" style={{ position: 'absolute', color: '#8a8982' }}>What would you like to do?</span><span className="dv-type" style={{ position: 'absolute', whiteSpace: 'nowrap', overflow: 'hidden', borderRight: '.12cqw solid #1b1b19' }}>Add a dark mode toggle to the live board</span></div>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ padding: '.5cqw 1cqw', borderRadius: '99px', boxShadow: '0 0 0 1px rgba(27,27,25,.12)', fontSize: '1.15cqw', fontWeight: '500' }}>Claude Code · Opus</span><span className="dv-send" style={{ width: '2.8cqw', height: '2.8cqw', borderRadius: '50%', display: 'grid', placeItems: 'center' }}><svg viewBox="0 0 14 14" style={{ width: '1.3cqw', height: '1.3cqw' }} aria-hidden="true"><path d="M7 12V2M3 6l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span></div>
</div>
<div className="dv-toast" style={{ position: 'absolute', left: '50%', bottom: '13.5cqw', padding: '.7cqw 1.4cqw', borderRadius: '99px', background: '#22382b', color: '#f7f6f3', fontSize: '1.15cqw', whiteSpace: 'nowrap' }}>Sent to Live board · picked up where it left off</div>
</div>
</div>
<svg className="dv-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2l15 9-6.5 1.6L9.8 19z" fill="#1b1b19" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" /></svg>
<span className="dv-click" aria-hidden="true" />  </div>;
}
