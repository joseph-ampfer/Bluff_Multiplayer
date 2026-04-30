import type { CSSProperties } from 'react';

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  ready?: boolean;
  eliminated?: boolean;
}

export function Avatar({ name, size = 36, ready = false, eliminated = false }: AvatarProps) {
  const hue = hashName(name) % 360;
  const bg = `hsl(${hue}, 42%, 32%)`;

  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: size * 0.4,
    background: bg,
  };

  const className = [
    'avatar',
    ready ? '--ready' : '',
    eliminated ? '--eliminated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} style={style} aria-label={`Avatar for ${name}`}>
      {getInitials(name)}
    </div>
  );
}
