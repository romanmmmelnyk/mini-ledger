import { useId } from 'react';

type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  const name = useId();
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className="segmented-item">
          <input
            type="radio"
            name={name}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span className="num">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
