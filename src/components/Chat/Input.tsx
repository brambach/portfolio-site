import { forwardRef, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import './input.css';

const PLACEHOLDERS = [
  'Ask about my work',
  'Ask about my projects',
  'Ask about AI & tools',
  'Ask for my résumé',
];

type Props = {
  disabled?: boolean;
  onSubmit: (text: string, inputEl: HTMLInputElement) => void;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { disabled, onSubmit },
  ref
) {
  const [value, setValue] = useState('');
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (value || focused) return;
    let i = 0;
    const handle = setInterval(() => {
      i = (i + 1) % PLACEHOLDERS.length;
      setPlaceholder(PLACEHOLDERS[i]);
    }, 5000);
    return () => clearInterval(handle);
  }, [value, focused]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const inputEl = e.currentTarget.querySelector('input') as HTMLInputElement;
    onSubmit(trimmed, inputEl);
    setValue('');
  };

  return (
    <form
      className={`chat-input ${focused ? 'focused' : ''}`}
      onSubmit={handleSubmit}
    >
      <input
        ref={ref}
        type="text"
        aria-label="Ask Bryce a question"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={disabled || !value.trim()}
      >
        <ArrowUp size={16} />
      </button>
    </form>
  );
});
