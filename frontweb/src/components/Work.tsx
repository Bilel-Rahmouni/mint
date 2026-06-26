import './Work.css'

const projects = [
  { name: 'wyngo', href: 'https://wyngo.co' },
  { name: 'cash cash', href: 'https://cashcash.tn' },
  { name: 'dozone', href: 'https://dozone.io' },
  { name: 'onecrew.pro', href: 'https://onecrew.pro' },
  { name: 'onecrew.me', href: 'https://onecrew.me' },
  {
    name: 'takwira',
    href: 'https://play.google.com/store/apps/details?id=tn.rebounddev.takwira_flutter',
  },
  { name: 'koultounsi.com', href: 'https://koultounsi.com' },
  { name: 'tounsy.com', href: 'https://tounsy.com' },
  { name: 'ultimate calculator', href: 'https://ultimatecalculator.app' },
  { name: 'brain gym', href: 'https://braingym.tn' },
]

export function Work() {
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
