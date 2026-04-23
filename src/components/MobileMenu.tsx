import { useState } from 'react';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/ui/sheet';

const LINKS: { label: string; href: string }[] = [
  { label: 'Work', href: '#work' },
  { label: 'Projects', href: '#projects' },
  { label: 'AI & Tools', href: '#stack' },
  { label: 'Contact', href: '#contact' },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation menu"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          padding: 8,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Menu size={22} aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        side="right"
        style={{
          background: '#000',
          color: '#fff',
          borderLeft: '1px solid var(--hairline-dark)',
          width: '100vw',
          maxWidth: '100vw',
        }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: '#fff', fontFamily: 'var(--ff-display)' }}>
            Menu
          </SheetTitle>
          <SheetDescription className="sr-only">Primary navigation</SheetDescription>
        </SheetHeader>
        <nav
          aria-label="Mobile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            padding: '24px 8px',
            fontFamily: 'var(--ff-display)',
            fontSize: 20,
            fontWeight: 400,
          }}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ color: '#fff' }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/Bryce_Rambach_Resume.pdf"
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
            style={{
              marginTop: 16,
              padding: '12px 22px',
              borderRadius: 'var(--r-pill)',
              border: '1px solid rgba(255,255,255,0.5)',
              textAlign: 'center',
              fontFamily: 'var(--ff-text)',
              fontSize: 15,
              fontWeight: 500,
              color: '#fff',
            }}
          >
            Résumé
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
