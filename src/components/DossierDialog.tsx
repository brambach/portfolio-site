import * as Dialog from '@radix-ui/react-dialog';
import { PROJECTS } from '../lib/projects';

type DossierDialogProps = {
  openSlug: string | null;
  onClose: () => void;
};

export function DossierDialog({ openSlug, onClose }: DossierDialogProps) {
  const project = openSlug ? PROJECTS.find((p) => p.slug === openSlug) : null;
  const open = Boolean(project);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[80]"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        />
        <Dialog.Content
          className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-[920px] -translate-y-1/2 overflow-hidden rounded-[20px] border p-8 max-h-[85vh] overflow-y-auto"
          style={{
            background: 'rgba(8,10,14,0.92)',
            backdropFilter: 'blur(30px) saturate(160%)',
            borderColor: 'var(--color-hair-2)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {project && (
            <>
              <div className="flex items-start justify-between gap-6">
                <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>
                  {project.index} — {project.kind}
                </div>
                <Dialog.Close
                  aria-label="Close dossier"
                  className="rounded-md p-1.5 text-white/70 hover:text-white hover:bg-white/5"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Dialog.Close>
              </div>

              <Dialog.Title className="font-serif mt-4" style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1, color: 'var(--color-ink)' }}>
                {project.title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 font-mono text-[11px]" style={{ color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>
                {project.kicker}
              </Dialog.Description>

              <div className="mt-6 grid gap-8 md:grid-cols-[1fr_280px]">
                <div className="space-y-6">
                  <section>
                    <h4 className="font-mono text-[10.5px] uppercase mb-2" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Overview</h4>
                    <p className="text-[14px] whitespace-pre-line" style={{ color: 'var(--color-ink-2)', lineHeight: 1.65 }}>
                      {project.dossier.overview}
                    </p>
                  </section>

                  <section>
                    <h4 className="font-mono text-[10.5px] uppercase mb-3" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Key decisions</h4>
                    <ul className="space-y-3">
                      {project.dossier.decisions.map((d) => (
                        <li key={d.title}>
                          <div className="font-serif text-[18px]" style={{ color: 'var(--color-ink)' }}>{d.title}</div>
                          <p className="text-[13.5px] mt-1" style={{ color: 'var(--color-ink-2)', lineHeight: 1.6 }}>{d.body}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-mono text-[10.5px] uppercase mb-3" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Stack</h4>
                    <dl className="grid gap-3">
                      {project.dossier.stack.map((s) => (
                        <div key={s.label} className="grid grid-cols-[100px_1fr] gap-3">
                          <dt className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: '0.14em', color: 'var(--color-ink-3)' }}>{s.label}</dt>
                          <dd className="text-[13.5px]" style={{ color: 'var(--color-ink-2)' }}>{s.values.join(' · ')}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </div>

                <aside className="space-y-4 text-[12.5px]" style={{ color: 'var(--color-ink-2)' }}>
                  <div>
                    <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Role</div>
                    <div className="mt-1">{project.dossier.role}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10.5px] uppercase" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Timeline</div>
                    <div className="mt-1">{project.dossier.timeline}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10.5px] uppercase mb-1" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Outcomes</div>
                    <ul className="space-y-1.5">
                      {project.dossier.outcomes.map((o) => (
                        <li key={o} className="flex gap-2">
                          <span style={{ color: 'rgb(134,239,172)' }}>↳</span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {project.dossier.links && (
                    <div>
                      <div className="font-mono text-[10.5px] uppercase mb-1" style={{ letterSpacing: '0.16em', color: 'var(--color-ink-3)' }}>Links</div>
                      <ul className="space-y-1">
                        {project.dossier.links.map((l) => (
                          <li key={l.href}>
                            <a href={l.href} target="_blank" rel="noopener" className="underline">{l.label}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
