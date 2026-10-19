import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { Work } from '../components/Work'
import { Footer } from '../components/Footer'
import { useAnalytics } from '../hooks/useAnalytics'

export function HomePage() {
  useAnalytics()

  return (
    <div className="site">
      <Header />
      <main>
        <Hero />
        <Work />
      </main>
      <Footer />
    </div>
  )
}
