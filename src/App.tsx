import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { Cpd } from "./components/pages/Cpd";
import { Intro } from "./components/pages/Intro";
import { ProjectsView } from "./components/pages/ProjectsView";
import { I18nProvider } from "./i18n/I18nProvider";
import "./styles.css";
import { TracksProvider } from "./tracks/TracksProvider";

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <TracksProvider>
          <Router>
            <ScrollToTop />
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Intro />} />
                <Route path="/cpd" element={<Cpd />} />
                <Route path="/projects" element={<ProjectsView />} />
              </Routes>
            </main>
            <Footer />
          </Router>
        </TracksProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
