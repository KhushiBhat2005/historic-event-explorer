import { HistoricalEvent } from '../types';
import { sampleEvents } from '../data/events';

// In-memory "database"
let eventsDB: HistoricalEvent[] = [...sampleEvents].sort((a, b) => b.year - a.year);

// Simulate network latency
const FAKE_LATENCY = 500;

export const getEvents = (): Promise<HistoricalEvent[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a copy to prevent direct mutation
      resolve([...eventsDB]);
    }, FAKE_LATENCY);
  });
};

export const postEvent = (newEventData: Omit<HistoricalEvent, 'id'>): Promise<HistoricalEvent> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const eventWithId: HistoricalEvent = {
        ...newEventData,
        id: new Date().toISOString() + Math.random(),
      };
      // Add to the "database" and re-sort
      eventsDB = [eventWithId, ...eventsDB].sort((a, b) => b.year - a.year);
      resolve(eventWithId);
    }, FAKE_LATENCY);
  });
};
