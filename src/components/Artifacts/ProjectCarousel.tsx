import { ArtifactPiece } from './ArtifactPiece';
import { PROJECTS } from '@/src/lib/content';
import './artifacts.css';

export function ProjectCarousel() {
  return (
    <div className="artifact">
      <ArtifactPiece index={0} from="top-right">
        <div className="artifact-eyebrow">Selected projects</div>
      </ArtifactPiece>
      {PROJECTS.map((p, i) => (
        <ArtifactPiece
          key={p.id}
          index={i + 1}
          from={i % 2 ? 'bottom-right' : 'right'}
        >
          <article style={{ marginBottom: i < PROJECTS.length - 1 ? 14 : 0 }}>
            <h3 className="artifact-title" style={{ fontSize: 20, marginBottom: 4 }}>
              {p.title}
            </h3>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--color-muted)',
                marginBottom: 6,
              }}
            >
              {p.subtitle}
            </div>
            <p className="artifact-body" style={{ marginBottom: 8 }}>
              {p.body}
            </p>
            <div className="artifact-tags">
              {p.tags.map((t) => (
                <span key={t} className="artifact-tag">
                  {t}
                </span>
              ))}
            </div>
            {i < PROJECTS.length - 1 && <div className="artifact-divider" />}
          </article>
        </ArtifactPiece>
      ))}
    </div>
  );
}
