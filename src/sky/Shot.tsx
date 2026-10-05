import type { CSSProperties, ReactNode, Ref } from 'react';
import type { Picture, Work } from './work';

/** A project's picture as the list previews it and the project page opens on, so one can grow into the other.
 *  Port has no screenshots, so its picture is a drawn tile: a ring to hold. */
export function Shot({ work, picture = work.hero, alt = '', loading, children, className = '', piece, ref }: {
  work: Work; picture?: Picture & { port?: boolean }; alt?: string; loading?: 'lazy' | 'eager'; children?: ReactNode;
  className?: string; piece?: string; ref?: Ref<HTMLDivElement>;
}) {
  const port = 'port' in picture && picture.port;
  return <div ref={ref} data-piece={piece} className={`sky-shot${picture.tall ? ' is-tall' : ''}${port ? ' is-port' : ''}${className ? ` ${className}` : ''}`}>
    {port
      ? <div className="sky-port-tile"><i className="port-ring" /><span>Hold to close</span></div>
      : <img src={picture.src} alt={alt} loading={loading} decoding="async" style={picture.pos ? { '--pos': picture.pos } as CSSProperties : undefined} />}
    {children}
  </div>;
}
