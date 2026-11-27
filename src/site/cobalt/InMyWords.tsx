import { said, VOICE, type VoiceId } from '../voice';

/* Why Bryce made a project, the hardest part and his favorite moment, in his words (src/site/voice.ts). A draft line
   carries a small tag so he can spot it on a preview; production builds leave drafts out, and the section goes too
   when nothing is left. */

export default function InMyWords({ id }: { id: VoiceId }) {
  const rows = said(VOICE[id] ?? []);
  if (!rows.length) return null;
  return <section className="p-col words" aria-labelledby={`c-${id}-words`}>
    <h2 className="serif" id={`c-${id}-words`}>In my words</h2>
    <dl>
      {rows.map(r => <div key={r.label} className={r.draft ? 'draft' : undefined}>
        <dt className="mono">{r.label}{r.draft && <span className="tag">draft</span>}</dt>
        <dd>{r.text}</dd>
      </div>)}
    </dl>
  </section>;
}
