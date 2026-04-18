import type { ArtifactKind } from '@/src/lib/content';
import { RoleCard } from './RoleCard';
import { ProjectCarousel } from './ProjectCarousel';
import { StackStrip } from './StackStrip';
import { ResumeArtifact } from './ResumeArtifact';
import { ContactCard } from './ContactCard';

type Props = { kind: ArtifactKind };

export function ArtifactRenderer({ kind }: Props) {
  switch (kind) {
    case 'role':
      return <RoleCard />;
    case 'projects':
      return <ProjectCarousel />;
    case 'stack':
      return <StackStrip />;
    case 'resume':
      return <ResumeArtifact />;
    case 'contact':
      return <ContactCard />;
  }
}
