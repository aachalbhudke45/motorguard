import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toasts from './components/Toasts';
import Dashboard from './pages/Dashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import MotorHealth from './pages/MotorHealth';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { NAV_ITEMS } from './config/constants';

const PAGES = {
  dashboard: Dashboard,
  live: LiveMonitoring,
  health: MotorHealth,
  maintenance: PredictiveMaintenance,
  alerts: Alerts,
  history: History,
  reports: Reports,
  settings: Settings,
};

const pageFromHash = () => {
  const id = window.location.hash.replace('#/', '').replace('#', '');
  return PAGES[id] ? id : 'dashboard';
};

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (id) => {
    window.location.hash = `/${id}`;
    setPage(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  };

  const Page = PAGES[page];
  const title = NAV_ITEMS.find((n) => n.id === page)?.label;

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar active={page} onNavigate={navigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Topbar title={title} onMenu={() => setMobileOpen(true)} onNavigate={navigate} />
      <main key={page} className="mx-auto max-w-[1500px] animate-fadein px-4 pb-10 pt-5 sm:px-6">
        <Page onNavigate={navigate} />
      </main>
      <Toasts onNavigate={navigate} />
    </div>
  );
}
