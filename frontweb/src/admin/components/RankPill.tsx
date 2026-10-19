import './RankPill.css'

type Props = {
  rank: number
}

export function RankPill({ rank }: Props) {
  const tone = rank <= 3 ? 'gold' : rank <= 10 ? 'mint' : 'neutral'
  return <span className={`rank-pill rank-pill--${tone}`}>{rank}</span>
}
