import { useState, useEffect, useCallback } from 'react';
import { HistoricalEvent } from '../types';
import { getEvents, postEvent } from '../api';

export const useEvents = () => {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const addEvent = useCallback(async (newEvent: Omit<HistoricalEvent, 'id'>) => {
    const createdEvent = await postEvent(newEvent);
    setEvents((prevEvents) => [createdEvent, ...prevEvents].sort((a, b) => b.year - a.year));
    return createdEvent;
  }, []);

  return { events, addEvent, isLoading };
};
