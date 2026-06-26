import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { Footer } from './components/Footer'

function App() {
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

export default App
