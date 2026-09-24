import { initials } from '../utils/format';

const PALETTE = ['#5B7CFA', '#8E6CF0', '#E0689B', '#F08A4B', '#2FB38A', '#2BA6D9', '#C1872E'];

function colorFor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface Props {
  id: string;
  title: string;
  size?: 'md' | 'sm';
}

export function Avatar({ id, title, size = 'md' }: Props) {
  return (
    <span className={`avatar avatar--${size}`} style={{ background: colorFor(id) }} aria-hidden="true">
      {initials(title)}
    </span>
  );
}
