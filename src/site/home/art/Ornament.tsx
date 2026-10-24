/* The engraved rule between sections, ported from ornament() in design-system/components.html: double hairlines
   either side of a small guilloche, six phase-shifted waves under a lens-shaped envelope. Static: the lens is drawn
   once here at a fixed size, and the hairlines are stretchy SVGs either side, so it needs no measuring. */

const L = 132, H = 22, CY = 11, W = L + 16, CX = W / 2;

const lens = (() => {
  let p = '';
  for (let k = 0; k < 6; k++) for (let i = 0; i <= 120; i++) {
    const t = i / 120, env = Math.sin(Math.PI * t) ** 0.9 * 7;
    p += (i ? 'L' : 'M') + (CX - L / 2 + t * L).toFixed(1) + ',' + (CY + env * Math.sin(2 * Math.PI * 3 * t + (k * Math.PI) / 3)).toFixed(2);
  }
  return p;
})();
const dia = (x: number) => `M${x - 3},${CY}L${x},${CY - 3}L${x + 3},${CY}L${x},${CY + 3}Z`;

function Rules() {
  return <svg className="orn__rules" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d={`M0,${CY - 1.5}H100M0,${CY + 1.5}H100`} vectorEffect="non-scaling-stroke" />
  </svg>;
}

export default function Ornament() {
  return <div className="orn" aria-hidden="true">
    <Rules />
    <svg className="orn__lens" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor">
        <path d={lens} strokeWidth=".55" strokeOpacity=".6" />
        <path d={dia(3) + dia(W - 3)} strokeWidth=".7" strokeOpacity=".6" />
        <circle cx={CX} cy={CY} r="2.2" strokeWidth=".7" strokeOpacity=".7" />
      </g>
    </svg>
    <Rules />
  </div>;
}
