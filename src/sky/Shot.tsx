import type { CSSProperties, ReactNode, Ref } from 'react';
import type { Picture } from './work';

/** Fields that line up between an HR system and payroll, for the drawn integrations picture. Generic names, not
 *  anyone's real mapping. */
const FIELDS = [['Start date', 'Hire date'], ['Pay rate', 'Base rate'], ['Leave balance', 'Leave balance'], ['Bank account', 'Payment details']] as const;

/** A picture as the home page raises it and a project page opens on, so one can grow into the other. Port has no
 *  screenshots, so its picture is a drawn tile: a ring to hold. The integrations work is private, so its picture is
 *  a drawing of a field mapping, and says so. */
export function Shot({ picture, alt = '', loading, children, className = '', piece, ref, held = false }: {
  picture: Picture & { port?: boolean; map?: boolean }; alt?: string; loading?: 'lazy' | 'eager'; children?: ReactNode;
  className?: string; piece?: string; ref?: Ref<HTMLDivElement>;
  /** Not wanted yet: the image is in place but doesn't load until this turns false. */
  held?: boolean;
}) {
  const kind = picture.port ? ' is-port' : picture.map ? ' is-map' : '';
  return <div ref={ref} data-piece={piece} className={`sky-shot${picture.tall ? ' is-tall' : ''}${kind}${className ? ` ${className}` : ''}`}>
    {picture.port
      ? <div className="sky-port-tile"><i className="port-ring" /><span>Hold to close</span></div>
      : picture.map
        ? <div className="sky-map-tile">
            <span className="sky-map-tile__side">HR system</span><span className="sky-map-tile__side">Payroll</span>
            {FIELDS.map(([from, to], i) => <div key={from} className="sky-map-tile__row" style={{ '--r': i } as CSSProperties}>
              <span>{from}</span><i /><span>{to}</span>
            </div>)}
            <small>A drawing. Client work stays private.</small>
          </div>
        : <img src={held ? undefined : picture.src} alt={alt} loading={loading} decoding="async" style={picture.pos ? { '--pos': picture.pos } as CSSProperties : undefined} />}
    {children}
  </div>;
}
