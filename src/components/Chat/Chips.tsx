import './chat.css';

type Props = {
  chips: string[];
  onPick: (text: string) => void;
  disabled?: boolean;
};

export function Chips({ chips, onPick, disabled }: Props) {
  return (
    <div className="chips">
      {chips.map((c) => (
        <button
          key={c}
          type="button"
          className="chip"
          onClick={() => onPick(c)}
          disabled={disabled}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
