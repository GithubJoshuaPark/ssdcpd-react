import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { CompanyAndOrganization } from "./components/pages/CompanyAndOrganization";
import { Cpd } from "./components/pages/Cpd";
import { Intro } from "./components/pages/Intro";
import { PrivacyPolicy } from "./components/pages/PrivacyPolicy";
import { ProjectsView } from "./components/pages/ProjectsView";
import { TermsOfService } from "./components/pages/TermsOfService";
import { WbsView } from "./components/pages/WbsView";
import { ChatFab } from "./components/popups/ChatFab";

import { I18nProvider } from "./i18n/I18nProvider";

import "./styles.css";

import { ShowGanttChartPerProject } from "./components/pages/ShowGanttChartPerProject";
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
                <Route path="/wbs/:projectId" element={<WbsView />} />
                <Route
                  path="/projects/:projectId/gantt"
                  element={<ShowGanttChartPerProject />}
                />
                <Route
                  path="/organization"
                  element={<CompanyAndOrganization />}
                />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
              </Routes>
            </main>
            <Footer />
            <ChatFab />
          </Router>
        </TracksProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
