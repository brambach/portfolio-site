import { Mail, Phone, Linkedin, Github } from 'lucide-react';
import type { CSSProperties } from 'react';
import { ArtifactPiece } from './ArtifactPiece';
import { BIO } from '@/src/lib/content';
import './artifacts.css';

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--color-ink)',
  marginBottom: 8,
  textDecoration: 'none',
};

export function ContactCard() {
  return (
    <article className="artifact">
      <ArtifactPiece index={0} from="top-right">
        <div className="artifact-eyebrow">Contact</div>
      </ArtifactPiece>
      <ArtifactPiece index={1}>
        <a href={`mailto:${BIO.email}`} style={ROW_STYLE}>
          <Mail size={16} color="var(--color-accent)" /> {BIO.email}
        </a>
      </ArtifactPiece>
      <ArtifactPiece index={2}>
        <a href={`tel:${BIO.phone.replace(/\D/g, '')}`} style={ROW_STYLE}>
          <Phone size={16} color="var(--color-accent)" /> {BIO.phone}
        </a>
      </ArtifactPiece>
      <ArtifactPiece index={3}>
        <a href={BIO.linkedin} target="_blank" rel="noreferrer" style={ROW_STYLE}>
          <Linkedin size={16} color="var(--color-accent)" /> linkedin.com/in/bryce-rambach
        </a>
      </ArtifactPiece>
      <ArtifactPiece index={4}>
        <a href={BIO.github} target="_blank" rel="noreferrer" style={ROW_STYLE}>
          <Github size={16} color="var(--color-accent)" /> github.com/brambach
        </a>
      </ArtifactPiece>
      <ArtifactPiece index={5} from="bottom-right">
        <p className="artifact-body" style={{ marginTop: 10, marginBottom: 0 }}>
          {BIO.availability}
        </p>
      </ArtifactPiece>
    </article>
  );
}
