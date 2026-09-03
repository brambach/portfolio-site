import { EnvelopeReveal } from '../EnvelopeReveal';
import { InkNote } from '../InkNote';
import { SettleWords } from '../SettleWords';

export function WorkSection() {
  return (
    <section id="work" data-waypoint="1" className="relative overflow-hidden">
      {/* golden hour gets through the canopy here: two shafts, barely there */}
      <div
        aria-hidden
        className="shaft1 pointer-events-none absolute -top-24 left-[14%] h-[130%] w-16"
        style={{
          background:
            'linear-gradient(180deg, rgba(247,231,196,0.5) 0%, rgba(247,231,196,0) 78%)',
          transform: 'skewX(-14deg)',
        }}
      />
      <div
        aria-hidden
        className="shaft2 pointer-events-none absolute -top-24 left-[38%] h-[120%] w-9"
        style={{
          background:
            'linear-gradient(180deg, rgba(247,231,196,0.36) 0%, rgba(247,231,196,0) 72%)',
          transform: 'skewX(-14deg)',
        }}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-28 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:items-center md:px-12 md:py-40 lg:pl-32">
        <div className="flex max-w-[430px] flex-col gap-5">
          <div className="font-mono text-[11px] tracking-[0.2em] text-oak/55">the work</div>
          <SettleWords
            text="Systems, wired together."
            className="text-balance font-display text-[42px] font-medium leading-[1.05] md:text-[56px]"
          />
          <p className="max-w-[360px] text-[15px] leading-[1.7] text-inksoft">
            By day I wire payroll, HR and finance platforms together at the consultancy. The
            kind of plumbing nobody notices, which is the point.
          </p>
          <div className="font-mono text-[10.5px] tracking-[0.08em] text-oak/50">
            an integration platform · a payroll system · a rostering system · the finance system
          </div>
        </div>

        <div className="relative w-full">
          <EnvelopeReveal
            src="/images/desk-6pm.jpg"
            alt="a desk with a curved ultrawide monitor full of code in late golden light"
            rotate={-1.2}
            coverColor="#E8C98F"
            className="ml-auto aspect-[26/17] w-full max-w-[520px] shadow-[0_18px_44px_rgba(28,53,39,0.28)]"
          />
          <div className="ml-auto mt-4 flex w-full max-w-[520px] items-end justify-between pr-2">
            <InkNote rotate={-2} className="text-[24px] font-semibold text-inksoft">
              the desk, 6pm
            </InkNote>
          </div>
        </div>
      </div>
    </section>
  );
}
