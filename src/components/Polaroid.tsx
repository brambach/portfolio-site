/**
 * A print in a warm paper frame with a Caveat caption and an optional strip
 * of tape. Purely presentational; the vibe board animates these from outside.
 */
export function Polaroid({
  src,
  alt,
  caption,
  sub,
  rotate,
  tape,
  className = '',
  imgClassName = 'h-52',
}: {
  src: string;
  alt: string;
  caption: string;
  sub?: string;
  rotate: number;
  tape?: 'left' | 'right';
  className?: string;
  imgClassName?: string;
}) {
  return (
    <figure
      className={`relative m-0 bg-paperwarm p-[10px] pb-3 shadow-[0_16px_38px_rgba(42,37,25,0.28)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape && (
        <div
          aria-hidden
          className={`absolute -top-2.5 h-[22px] w-[76px] bg-[rgba(233,196,138,0.65)] ${
            tape === 'left' ? 'left-10 -rotate-4' : 'right-10 rotate-4'
          }`}
        />
      )}
      <div className={`relative overflow-hidden ${imgClassName}`}>
        <img src={src} alt={alt} className="block h-full w-full object-cover" />
      </div>
      <figcaption className="mt-1.5 text-center font-hand text-xl font-semibold text-inksoft">
        {caption}
        {sub && (
          <span className="mt-0.5 block font-mono text-[8.5px] font-normal tracking-[0.14em] text-oak/60">
            {sub}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
