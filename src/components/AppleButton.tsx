import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type Variant = 'primary' | 'ghost';

type CommonProps = {
  variant: Variant;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
  href?: undefined;
};

type AnchorProps = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
  href: string;
};

export type AppleButtonProps = ButtonProps | AnchorProps;

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--ff-text)',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: '-0.2px',
  padding: '11px 22px',
  borderRadius: 'var(--r-pill)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: 'opacity 200ms var(--ease-apple), background-color 200ms var(--ease-apple)',
  textDecoration: 'none',
};

const primaryStyle: CSSProperties = {
  background: 'var(--accent-blue)',
  color: '#fff',
  border: '1px solid var(--accent-blue)',
};

const ghostStyle: CSSProperties = {
  background: 'transparent',
  color: 'var(--link-dark)',
  border: '1px solid rgba(41,151,255,0.6)',
};

export function AppleButton(props: AppleButtonProps) {
  const { variant, children, className, ...rest } = props;
  const style = { ...baseStyle, ...(variant === 'primary' ? primaryStyle : ghostStyle) };
  const classes = ['apple-btn', variant === 'primary' ? 'apple-btn--primary' : 'apple-btn--ghost', className]
    .filter(Boolean)
    .join(' ');

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} style={style} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} style={style} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
