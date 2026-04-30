import type { TableRank } from '../../../shared/types';

interface DeclaredRankBannerProps {
  rank: TableRank | null | undefined;
}

const PLURAL: Record<TableRank, string> = {
  king: 'KINGS',
  queen: 'QUEENS',
  ace: 'ACES',
};

export function DeclaredRankBanner({ rank }: DeclaredRankBannerProps) {
  if (!rank) return null;
  return (
    <div className="declared-rank" aria-live="polite">
      <span className="declared-rank__label">The Call</span>
      <span className="declared-rank__rank">{PLURAL[rank]}</span>
    </div>
  );
}
