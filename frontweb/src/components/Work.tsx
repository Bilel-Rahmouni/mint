import { usePortfolio } from '../hooks/usePortfolio'
import type { PortfolioProject } from '../hooks/usePortfolio'
import './Work.css'

const fallbackProjects: PortfolioProject[] = [
  { name: 'wyngo', href: 'https://wyngo.co' },
  { name: 'cash cash', href: 'https://cash-game.site' },
  { name: 'dozone', href: 'https://dozone.site' },
  { name: 'onecrew.pro', href: 'https://onecrew.pro' },
  { name: 'onecrew.me', href: 'https://onecrew.me' },
  {
    name: 'takwira',
    href: 'https://play.google.com/store/apps/details?id=tn.rebounddev.takwira_flutter',
  },
  { name: 'koultounsi.com', href: 'https://koultounsi.com' },
  { name: 'tounsy.com', href: 'https://tounsy.com' },
  { name: 'ultimate calculator', href: 'https://ultimatecalculator.site' },
  { name: 'brain gym', href: 'https://brain-gym.site' },
]

export function Work() {
  const projects = usePortfolio(fallbackProjects)

  return (
    <section className="work">
      <ul className="work__list">
        {projects.map((project) => (
          <li key={project.href} className="work__item">
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="work__link"
            >
              {project.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
