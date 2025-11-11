import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Search, X, Calendar, MapPin, BarChart } from 'lucide-react';
import { HistoricalEvent, Category, Era } from '../types';
import { CATEGORY_METADATA, ERA_LABELS } from '../constants';
import { formatDate, formatYear } from '../utils/helpers';
import Badge from '../components/ui/Badge';

interface LibraryPageProps {
  events: HistoricalEvent[];
  initialSelectedEventId: string | null;
  clearInitialSelectedEventId: () => void;
}

const FilterControls: React.FC<{
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (category: Category | 'all') => void;
  setEraFilter: (era: Era | 'all') => void;
  searchTerm: string;
  categoryFilter: Category | 'all';
  eraFilter: Era | 'all';
}> = ({ setSearchTerm, setCategoryFilter, setEraFilter, searchTerm, categoryFilter, eraFilter }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8 p-4 bg-brand-parchment-dark rounded-lg border border-brand-gold/20 shadow-lg">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={20} />
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-brand-parchment-light border border-brand-gold/30 rounded-md pl-10 pr-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
        className="flex-grow sm:flex-grow-0 bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none"
      >
        <option value="all">All Categories</option>
        {Object.entries(CATEGORY_METADATA).map(([key, { label, emoji }]) => (
          <option key={key} value={key}>{emoji} {label}</option>
        ))}
      </select>
      <select
        value={eraFilter}
        onChange={(e) => setEraFilter(e.target.value as Era | 'all')}
        className="flex-grow sm:flex-grow-0 bg-brand-parchment-light border border-brand-gold/30 rounded-md px-4 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-gold focus:outline-none"
      >
        <option value="all">All Eras</option>
        {Object.entries(ERA_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  );
};

const EventCard: React.FC<{ event: HistoricalEvent; onSelect: (event: HistoricalEvent) => void; viewMode: 'grid' | 'list' }> = ({ event, onSelect, viewMode }) => {
  const metadata = CATEGORY_METADATA[event.category];

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => onSelect(event)}
        className="w-full flex items-center space-x-6 p-4 bg-brand-parchment-dark rounded-lg border border-brand-gold/20 shadow-lg cursor-pointer hover:border-brand-gold/50 transition-colors"
      >
        <img src={event.image_url} alt={event.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center space-x-3">
             <Badge style={{ backgroundColor: `${metadata.color}30`, color: metadata.color }}>{metadata.label}</Badge>
             <span className="text-sm text-brand-text-secondary">{formatYear(event.year)}</span>
          </div>
          <h3 className="text-lg font-serif font-bold mt-1 text-brand-text-primary">{event.title}</h3>
          <p className="text-sm text-brand-text-secondary mt-1 line-clamp-2">{event.summary}</p>
        </div>
        <button className="px-4 py-2 text-sm bg-brand-gold/80 text-white rounded-md hover:bg-brand-gold transition-colors font-semibold">View</button>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(event)}
      className="bg-brand-parchment-dark rounded-lg border border-brand-gold/20 shadow-lg overflow-hidden cursor-pointer group"
    >
      <div className="relative h-48">
        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter sepia-[.3]" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-parchment-dark to-transparent"></div>
        <Badge className="absolute top-3 right-3" style={{ backgroundColor: `${metadata.color}30`, color: metadata.color }}>
            {metadata.emoji} {metadata.label}
        </Badge>
      </div>
      <div className="p-4 flex flex-col h-[230px]">
        <h3 className="text-xl font-serif font-bold text-brand-text-primary">{event.title}</h3>
        <div className="flex items-center text-sm text-brand-text-secondary space-x-4 mt-2">
            <span>{formatYear(event.year)}</span>
            {event.location && <span className="truncate">{event.location}</span>}
        </div>
        <div className="my-3 p-3 bg-brand-parchment-light/50 rounded-md border border-brand-gold/10 flex-grow">
            <p className="text-sm text-brand-text-secondary line-clamp-3">{event.summary}</p>
        </div>
         <button className="w-full mt-auto py-2 bg-brand-gold/80 text-white rounded-md hover:bg-brand-gold transition-colors font-semibold">View Details</button>
      </div>
    </motion.div>
  );
};

interface EventModalProps {
    event: HistoricalEvent;
    onClose: () => void;
    onToggleFavorite: (eventId: string) => void;
    isFavorited: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onToggleFavorite, isFavorited }) => {
  const metadata = CATEGORY_METADATA[event.category];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  
  const handleLearnMore = () => {
    const query = encodeURIComponent(`${event.title} history`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: {duration: 0.2} }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20, opacity: 0, transition: {duration: 0.2} }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-brand-parchment-dark rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-brand-gold/30 shadow-2xl"
      >
        <div className="w-full md:w-1/3 h-64 md:h-auto relative">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover filter sepia-[.3]"/>
             <div className="absolute inset-0 bg-gradient-to-t from-brand-parchment-dark via-brand-parchment-dark/70 to-transparent"></div>
        </div>
        <div className="w-full md:w-2/3 p-8 overflow-y-auto">
          <div className="flex justify-between items-start">
              <div>
                <Badge style={{ backgroundColor: `${metadata.color}20`, color: metadata.color }}>
                  {metadata.emoji} {metadata.label}
                </Badge>
                <h2 className="text-4xl font-serif font-bold mt-2 text-brand-text-primary">{event.title}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-parchment-light transition-colors text-brand-text-secondary">
                  <X size={24} />
              </button>
          </div>

          <div className="flex flex-wrap gap-4 text-brand-text-secondary my-4 text-sm">
              <div className="flex items-center gap-2"><Calendar size={16} /> <span>{formatDate(event.date)} ({formatYear(event.year)})</span></div>
              {event.location && <div className="flex items-center gap-2"><MapPin size={16} /> <span>{event.location}</span></div>}
              <div className="flex items-center gap-2"><BarChart size={16} /> <span>{event.significance} Significance</span></div>
          </div>
          
          <div className="my-6 p-4 bg-brand-gold/10 border-l-4 border-brand-gold rounded-r-md">
            <h4 className="font-bold text-brand-gold font-serif">AI Generated Summary</h4>
            <p className="text-brand-text-secondary mt-1">{event.summary}</p>
          </div>

          <div className="prose prose-invert max-w-none text-brand-text-secondary">
            <h4 className="text-brand-text-primary font-serif">Full Description</h4>
            <p>{event.description}</p>
          </div>

          <div className="mt-8 flex gap-4">
               <button 
                onClick={() => onToggleFavorite(event.id)}
                className={`flex-1 py-3 text-white rounded-lg font-semibold transition-colors ${
                  isFavorited 
                    ? 'bg-brand-red/70 hover:bg-brand-red/50' 
                    : 'bg-brand-red hover:bg-brand-red/80'
                }`}
              >
                {isFavorited ? 'Unfavorite' : 'Save Favorite'}
              </button>
              <button 
                onClick={handleLearnMore}
                className="flex-1 py-3 bg-brand-parchment-light text-brand-text-primary rounded-lg font-semibold hover:bg-brand-gold/20 transition-colors">
                  Learn More
              </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};


const LibraryPage: React.FC<LibraryPageProps> = ({ events, initialSelectedEventId, clearInitialSelectedEventId }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [eraFilter, setEraFilter] = useState<Era | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [libraryEvents, setLibraryEvents] = useState<HistoricalEvent[]>(events);

  useEffect(() => {
    setLibraryEvents(events);
  }, [events]);

  useEffect(() => {
    if (initialSelectedEventId) {
      const eventToSelect = libraryEvents.find(e => e.id === initialSelectedEventId);
      if (eventToSelect) {
        setSelectedEvent(eventToSelect);
      }
      clearInitialSelectedEventId();
    }
  }, [initialSelectedEventId, libraryEvents, clearInitialSelectedEventId]);
  
  const filteredEvents = useMemo(() => {
    return libraryEvents.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      const matchesEra = eraFilter === 'all' || event.era === eraFilter;
      return matchesSearch && matchesCategory && matchesEra;
    });
  }, [libraryEvents, searchTerm, categoryFilter, eraFilter]);

  const handleToggleFavorite = (eventId: string) => {
    setLibraryEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId) {
          const isFavorited = event.favorited_by?.includes('currentUser');
          const favorited_by = isFavorited
            ? event.favorited_by?.filter(u => u !== 'currentUser')
            : [...(event.favorited_by || []), 'currentUser'];
          
          const updatedEvent = { ...event, favorited_by };
          
          if (selectedEvent?.id === eventId) {
            setSelectedEvent(updatedEvent);
          }
          
          return updatedEvent;
        }
        return event;
      })
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-5xl font-serif font-bold text-brand-text-primary">Event Library</h1>
        <div className="flex items-center space-x-2 p-1 bg-brand-parchment-dark rounded-md border border-brand-gold/20">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-sm ${viewMode === 'grid' ? 'bg-brand-gold text-white' : 'text-brand-text-secondary'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-sm ${viewMode === 'list' ? 'bg-brand-gold text-white' : 'text-brand-text-secondary'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      <FilterControls 
        searchTerm={searchTerm}
        categoryFilter={categoryFilter}
        eraFilter={eraFilter}
        setSearchTerm={setSearchTerm}
        setCategoryFilter={setCategoryFilter}
        setEraFilter={setEraFilter}
      />
      
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        <motion.div
            layout
            className={
                viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'flex flex-col gap-4'
            }
        >
            <AnimatePresence>
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} onSelect={setSelectedEvent} viewMode={viewMode}/>
                    ))
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-16">
                        <p className="text-xl text-brand-text-secondary">No events found matching your criteria.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {selectedEvent && <EventModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            isFavorited={!!selectedEvent.favorited_by?.includes('currentUser')}
            onToggleFavorite={handleToggleFavorite}
        />}
      </AnimatePresence>
    </div>
  );
};

export default LibraryPage;