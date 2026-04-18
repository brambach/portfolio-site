import { ArtifactPiece } from './ArtifactPiece';
import { AI_STACK } from '@/src/lib/content';
import './artifacts.css';

export function StackStrip() {
  return (
    <div className="artifact">
      <ArtifactPiece index={0} from="top-right">
        <div className="artifact-eyebrow">AI & tools</div>
      </ArtifactPiece>
      {AI_STACK.map((s, i) => (
        <ArtifactPiece key={s.name} index={i + 1}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: i < AI_STACK.length - 1 ? 10 : 0,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                color: 'var(--color-accent)',
                minWidth: 130,
                lineHeight: 1.2,
              }}
            >
              {s.name}
            </div>
            <div className="artifact-body" style={{ flex: 1, margin: 0 }}>
              {s.use}
            </div>
          </div>
        </ArtifactPiece>
      ))}
    </div>
  );
}
