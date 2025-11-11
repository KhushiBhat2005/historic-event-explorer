import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart2, Calendar, CheckCircle, Hash, BookOpen } from 'lucide-react';
import { HistoricalEvent, Category, Era } from '../types';
import { CATEGORY_METADATA, ERA_LABELS } from '../constants';
import { formatYear } from '../utils/helpers';

interface DashboardPageProps {
  events: HistoricalEvent[];
  onViewEvent: (eventId: string) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number; color: string; }> = ({ icon, title, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-brand-parchment-dark p-6 rounded-lg border border-brand-gold/20 shadow-lg flex items-center space-x-4"
  >
    <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20`, color: color }}>
      {icon}
    </div>
    <div>
      <p className="text-brand-text-secondary text-sm">{title}</p>
      <p className="text-2xl font-bold text-brand-text-primary">{value}</p>
    </div>
  </motion.div>
);

const EraFilter: React.FC<{ selectedEra: Era | 'all'; onSelectEra: (era: Era | 'all') => void }> = ({ selectedEra, onSelectEra }) => {
    const eras: Array<Era | 'all'> = ['all', ...Object.values(Era)];
    const eraDisplayLabels: { [key in Era | 'all']: string } = {
        ...ERA_LABELS,
        all: 'All Time'
    };
  
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap items-center gap-2 mb-6"
      >
        <p className="font-semibold text-brand-text-secondary mr-2">Filter by Era:</p>
        {eras.map(era => (
          <button
            key={era}
            onClick={() => onSelectEra(era)}
            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ${
              selectedEra === era
                ? 'bg-brand-gold text-white shadow-md'
                : 'bg-brand-parchment-dark text-brand-text-secondary hover:bg-brand-parchment-light hover:text-brand-text-primary'
            }`}
          >
            {eraDisplayLabels[era]}
          </button>
        ))}
      </motion.div>
    );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ events, onViewEvent }) => {
  const [selectedEra, setSelectedEra] = useState<Era | 'all'>('all');

  const filteredEvents = useMemo(() => {
    if (selectedEra === 'all') {
      return events;
    }
    return events.filter(event => event.era === selectedEra);
  }, [events, selectedEra]);

  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentlyAdded = filteredEvents.filter(e => new Date(e.date).getTime() > sevenDaysAgo.getTime() && new Date(e.date).getTime() <= new Date().getTime()).length;
    
    const aiSummariesCoverage = totalEvents > 0 ? Math.round((filteredEvents.filter(e => e.summary).length / totalEvents) * 100) : 0;
    const totalCategories = new Set(filteredEvents.map(e => e.category)).size;

    return { totalEvents, recentlyAdded, aiSummariesCoverage, totalCategories };
  }, [filteredEvents]);

  const topCategories = useMemo(() => {
    const categoryCounts = filteredEvents.reduce((acc: Record<string, number>, event) => {
      const currentCount = acc[event.category] || 0;
      acc[event.category] = currentCount + 1;
      return acc;
    }, {} as Record<string, number>);

    // FIX: Cast the result of Object.entries to fix TypeScript type inference issues
    // which caused errors in the subsequent .sort() and .map() calls.
    return (Object.entries(categoryCounts) as [Category, number][])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        percentage: filteredEvents.length > 0 ? (count / filteredEvents.length) * 100 : 0,
      }));
  }, [filteredEvents]);
  
  const recentEvents = useMemo(() => filteredEvents.slice(0, 5), [filteredEvents]);

  const onThisDayEvents = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const day = today.getDate();

    return filteredEvents
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === month && eventDate.getDate() === day;
      })
      .sort((a, b) => a.year - b.year);
  }, [filteredEvents]);

  return (
    <div className="space-y-8 h-full">
      <h1 className="text-5xl font-serif font-bold text-brand-text-primary">Dashboard</h1>
      
      <EraFilter selectedEra={selectedEra} onSelectEra={setSelectedEra} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Hash size={24} />} title="Total Events" value={stats.totalEvents} color="#c09a6b" />
        <StatCard icon={<Calendar size={24} />} title="Recently Added" value={stats.recentlyAdded} color="#4a5f7a" />
        <StatCard icon={<CheckCircle size={24} />} title="AI Summary Coverage" value={`${stats.aiSummariesCoverage}%`} color="#6a7a4b" />
        <StatCard icon={<BarChart2 size={24} />} title="Total Categories" value={stats.totalCategories} color="#8a3b3b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 bg-brand-parchment-dark p-6 rounded-lg border border-brand-gold/20 shadow-lg"
        >
          <h2 className="text-2xl font-serif font-semibold mb-4 text-brand-gold">Recently Added Events</h2>
          <div className="space-y-2">
            {recentEvents.length > 0 ? (
              recentEvents.map((event, i) => {
                  const metadata = CATEGORY_METADATA[event.category];
                  return (
                      <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="flex items-center space-x-4 p-3 rounded-md hover:bg-brand-parchment-light transition-colors group cursor-pointer"
                          onClick={() => onViewEvent(event.id)}
                      >
                          <div className="p-2 rounded-full" style={{backgroundColor: `${metadata.color}20`}}>
                              <metadata.icon size={20} style={{color: metadata.color}} />
                          </div>
                          <div className="flex-1">
                              <p className="font-semibold text-brand-text-primary">{event.title}</p>
                              <p className="text-xs text-brand-text-secondary">{event.summary.substring(0, 60)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-brand-text-primary">{formatYear(event.year)}</p>
                            <p className="text-xs" style={{color: metadata.color}}>{metadata.label}</p>
                          </div>
                          <ArrowRight size={16} className="text-brand-text-secondary group-hover:text-brand-gold transition-colors"/>
                      </motion.div>
                  )
              })
            ) : (
              <div className="text-center py-8 text-brand-text-secondary">
                  <p>No recent events found for this era.</p>
              </div>
            )}
          </div>
        </motion.div>
        
        <div className="lg:col-span-1 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-brand-parchment-dark p-6 rounded-lg border border-brand-gold/20 shadow-lg flex-1 flex flex-col"
            >
              <h2 className="text-2xl font-serif font-semibold mb-4 text-brand-gold">On This Day in History</h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 -mr-2">
                {onThisDayEvents.length > 0 ? (
                  onThisDayEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex items-center space-x-3 group cursor-pointer"
                      onClick={() => onViewEvent(event.id)}
                    >
                      <div className="w-16 text-right flex-shrink-0">
                        <p className="font-bold text-brand-text-primary">{formatYear(event.year)}</p>
                      </div>
                      <div className="flex-1 border-l-2 border-brand-gold/30 pl-3 group-hover:border-brand-gold transition-colors">
                        <p className="font-semibold text-sm text-brand-text-primary group-hover:text-brand-gold transition-colors">{event.title}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-brand-text-secondary">
                    <BookOpen size={32} className="mb-2"/>
                    <p>No events found for this day in our archives.</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-brand-parchment-dark p-6 rounded-lg border border-brand-gold/20 shadow-lg"
            >
              <h2 className="text-2xl font-serif font-semibold mb-4 text-brand-gold">Top Categories</h2>
              <div className="space-y-4">
                  {topCategories.length > 0 ? topCategories.map((item, i) => {
                      const metadata = CATEGORY_METADATA[item.category];
                      return (
                          <div key={item.category}>
                              <div className="flex justify-between items-center mb-1 text-sm">
                                  <div className="flex items-center">
                                    <metadata.icon size={16} style={{color: metadata.color}} className="mr-2"/>
                                    <span className="font-semibold text-brand-text-primary">{metadata.label}</span>
                                  </div>
                                  <span className="text-brand-text-secondary">{item.count} events</span>
                              </div>
                              <div className="w-full bg-brand-parchment-light rounded-full h-2">
                                  <motion.div
                                      className="h-2 rounded-full"
                                      style={{ backgroundColor: metadata.color }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${item.percentage}%` }}
                                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                  ></motion.div>
                              </div>
                          </div>
                      )
                  }) : <p className="text-center text-brand-text-secondary py-4">No category data for this era.</p>}
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
