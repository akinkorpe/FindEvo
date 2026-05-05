interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span
      className={`font-[family-name:var(--font-brand)] tracking-tight text-[#12B886] ${className}`}
    >
      FindEvo
    </span>
  );
}
