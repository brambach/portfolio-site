import { Mail, Linkedin, Github, Download } from 'lucide-react';
import { TOPICS, BIO } from '@/src/lib/content';
import { useChatStore } from '@/src/lib/chat';
import './header.css';

type Props = {
  onTopic: (prompt: string) => void;
};

export function Header({ onTopic }: Props) {
  const reset = useChatStore((s) => s.reset);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="wordmark" onClick={reset}>
          Bryce <em>Rambach</em>
        </button>

        <nav className="topic-links" aria-label="Topic shortcuts">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              className="topic-link"
              onClick={() => onTopic(t.prompt)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          <a href={`mailto:${BIO.email}`} aria-label="Email">
            <Mail size={16} />
          </a>
          <a href={BIO.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
          <a href={BIO.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a className="resume-download" href="/Bryce_Rambach_Resume.pdf" download>
            <Download size={12} /> <span>Résumé</span>
          </a>
        </div>
      </div>
    </header>
  );
}
