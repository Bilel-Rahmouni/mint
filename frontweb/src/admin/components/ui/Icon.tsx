const PATHS = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5',
  plus: 'M12 5v14M5 12h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  back: 'M15 18 9 12l6-6',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  close: 'M6 6l12 12M18 6 6 18',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  code: 'm8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14',
  megaphone: 'M4 10v4h3l6 4V6L7 10H4ZM19 8a5 5 0 0 1 0 8M16.5 9.5a2.5 2.5 0 0 1 0 5',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 12h4v4H8z',
  trending: 'M3 17 9 11l4 4 8-8M16 7h5v5',
  rocket: 'M12 15c-3 0-5 2-5 5 3 0 5-2 5-5Zm0 0c0-3 2-5 5-5 0 3-2 5-5 5Zm-1-9 1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1ZM6 10l-2 1 2 1 1 2 1-2 2-1-2-1-1-2-1 2Z',
  pause: 'M8 5v14M16 5v14',
  play: 'm7 4 12 8-12 8V4Z',
} as const

export type IconName = keyof typeof PATHS

type Props = {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 16, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
