interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Toggle({ checked, onChange, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-brand-500" : "bg-ink-200"
      } disabled:opacity-50`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
