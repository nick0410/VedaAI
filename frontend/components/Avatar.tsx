interface Props {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 36, className = '' }: Props) {
  const inits = initials(name);
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`rounded-full object-cover bg-ink-100 border border-line ${className}`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold leading-none shrink-0 ${className}`}
    >
      {inits}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
