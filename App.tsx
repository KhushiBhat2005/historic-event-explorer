import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Library, PlusCircle, Rocket, Menu, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import CreateEventPage from './pages/CreateEventPage';
import SolarSystemPage from './pages/SolarSystemPage';
import { useEvents } from './hooks/useEvents';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { HistoricalEvent } from './types';

type Page = 'dashboard' | 'library' | 'timeline' | 'create';

// --- Toast Notification System ---
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastIcons = {
  success: <CheckCircle className="text-green-400" />,
  error: <AlertTriangle className="text-red-400" />,
  info: <Info className="text-blue-400" />,
};

const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex items-center p-4 max-w-sm w-full bg-brand-parchment-dark shadow-lg rounded-lg border border-brand-gold/20"
    >
      <div className="flex-shrink-0">{ToastIcons[toast.type]}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-brand-text-primary">{toast.message}</p>
      </div>
      <button onClick={() => onRemove(toast.id)} className="ml-4 flex-shrink-0 text-brand-text-secondary hover:text-brand-text-primary">
        <X size={18} />
      </button>
    </motion.div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return ReactDOM.createPortal(
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = new Date().toISOString() + Math.random();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { events, addEvent, isLoading } = useEvents();
  const [initialSelectedEventId, setInitialSelectedEventId] = useState<string | null>(null);

  const handleAddEvent = useCallback(async (newEventData: Omit<HistoricalEvent, 'id'>) => {
    const newEvent = await addEvent(newEventData);
    return newEvent;
  }, [addEvent]);

  const onEventCreated = () => {
    addToast('Event created successfully!', 'success');
    setCurrentPage('library');
  }
  
  const handleViewEvent = (eventId: string) => {
    setInitialSelectedEventId(eventId);
    setCurrentPage('library');
  };

  const pages = {
    dashboard: <DashboardPage events={events} onViewEvent={handleViewEvent} />,
    library: <LibraryPage events={events} initialSelectedEventId={initialSelectedEventId} clearInitialSelectedEventId={() => setInitialSelectedEventId(null)} />,
    timeline: <SolarSystemPage events={events} />,
    create: <CreateEventPage addEvent={handleAddEvent} onEventCreated={onEventCreated} />,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'timeline', label: 'Solar System', icon: Rocket },
    { id: 'create', label: 'Create Event', icon: PlusCircle },
  ];

  const Nav = () => (
    <nav className="space-y-2">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => {
            setCurrentPage(item.id as Page);
            setIsMenuOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
            currentPage === item.id
              ? 'bg-brand-gold text-white font-semibold'
              : 'text-brand-text-secondary hover:bg-brand-parchment-light hover:text-brand-text-primary'
          }`}
        >
          <item.icon size={22} />
          <span className="text-lg">{item.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex h-screen bg-brand-parchment-light">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-brand-parchment-dark p-4 flex-shrink-0 flex flex-col">
          <h1 className="text-3xl font-serif font-bold text-brand-gold text-center my-4">Timeline Lens</h1>
          <Nav />
        </aside>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          )}
        </AnimatePresence>
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: isMenuOpen ? 0 : '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 h-full w-64 bg-brand-parchment-dark p-4 z-50 md:hidden flex flex-col"
        >
          <h1 className="text-3xl font-serif font-bold text-brand-gold text-center my-4">Timeline Lens</h1>
          <Nav />
        </motion.aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="md:hidden p-4 bg-brand-parchment-dark flex justify-between items-center">
            <h1 className="text-xl font-serif font-bold text-brand-gold">Timeline Lens</h1>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              <Menu size={24} />
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto rustic-bg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {pages[currentPage]}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default App;