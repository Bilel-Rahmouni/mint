import './Delta.css'

type Props = {
  value: number
}

export function Delta({ value }: Props) {
  if (!value) return <span className="delta delta--flat">0</span>
  const up = value > 0
  return (
    <span className={`delta ${up ? 'delta--up' : 'delta--down'}`}>
      {up ? '+' : ''}
      {value}
    </span>
  )
}
