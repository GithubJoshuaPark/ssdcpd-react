import './styles.css'
import { I18nProvider } from './i18n/I18nProvider'
import { TracksProvider } from './tracks/TracksProvider'
import { Header } from './components/layout/Header'
import { Hero } from './components/sections/Hero'
import { TracksSection } from './components/sections/TracksSection'
import { TimelineSection } from './components/sections/TimelineSection'
import { AboutSection } from './components/sections/AboutSection'
import { Footer } from './components/layout/Footer'

function App() {
  return (
    <I18nProvider>
      <TracksProvider>
        <Header />
        <main>
          <Hero />
          <TracksSection />
          <TimelineSection />
          <AboutSection />
        </main>
        <Footer />
      </TracksProvider>
    </I18nProvider>
  )
}

export default App
