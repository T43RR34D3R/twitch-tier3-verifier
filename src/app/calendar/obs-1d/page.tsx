"use client";

import { useEffect, useState, useCallback } from "react";
import { format, isSameDay } from "date-fns";

interface CalendarEvent {
  id: number;
  date: string;
  title: string;
  description?: string;
  image_url?: string;
  background_color: string;
  text_color: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ObsOneDayCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      
      const response = await fetch(`/api/calendar?month=${month}&year=${year}`);
      const data = await response.json();
      
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        console.error('Failed to load events:', data.error);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  // Auto-advance to next day at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      setCurrentDate(new Date());
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [currentDate]);

  const getTodaysEvents = () => {
    return events.filter(event => 
      isSameDay(new Date(event.date), currentDate)
    ).sort((a, b) => {
      // All-day events first
      if (a.is_all_day && !b.is_all_day) return -1;
      if (!a.is_all_day && b.is_all_day) return 1;
      
      // Then by start time
      if (!a.is_all_day && !b.is_all_day) {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      }
      
      return 0;
    });
  };

  const todaysEvents = getTodaysEvents();
  const hasEvents = todaysEvents.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-black/80 backdrop-blur-xl flex items-center justify-center">
        <div className="text-white text-2xl">Loading today&apos;s events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            📅 {format(currentDate, 'EEEE')}
          </h1>
          <div className="text-3xl text-purple-200">
            {format(currentDate, 'MMMM d, yyyy')}
          </div>
        </div>

        {/* Events */}
        {hasEvents ? (
          <div className="space-y-4">
            {todaysEvents.map((event, index) => (
              <div
                key={event.id}
                className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/20"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'slideInFromLeft 0.8s ease-out forwards'
                }}
              >
                {/* Background */}
                {event.image_url ? (
                  <>
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.image_url})` }}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </>
                ) : (
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: event.background_color }}
                  />
                )}

                {/* Content */}
                <div className="relative p-6 backdrop-blur-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 
                        className="text-2xl font-bold mb-2"
                        style={{ 
                          color: event.image_url ? '#ffffff' : event.text_color,
                          textShadow: event.image_url ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                        }}
                      >
                        {event.title}
                      </h2>
                      
                      {event.description && (
                        <p 
                          className="text-lg mb-3 opacity-90"
                          style={{ 
                            color: event.image_url ? '#ffffff' : event.text_color,
                            textShadow: event.image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                          }}
                        >
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Time indicator */}
                    <div 
                      className="ml-4 px-4 py-2 rounded-xl backdrop-blur-md bg-white/20 border border-white/30"
                      style={{
                        color: event.image_url ? '#ffffff' : event.text_color,
                        textShadow: event.image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                      }}
                    >
                      {event.is_all_day ? (
                        <div className="text-lg font-semibold">All Day</div>
                      ) : (
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {event.start_time}
                          </div>
                          {event.end_time && event.end_time !== event.start_time && (
                            <div className="text-sm opacity-80">
                              to {event.end_time}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌅</div>
            <div className="text-3xl text-white font-semibold mb-2">
              No Events Today
            </div>
            <div className="text-xl text-purple-200">
              Enjoy your free day!
            </div>
          </div>
        )}

        {/* Live indicator */}
        <div className="fixed top-4 right-4 flex items-center space-x-2 bg-red-600/90 backdrop-blur-md rounded-full px-4 py-2 border border-red-400/50">
          <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">LIVE</span>
        </div>

        {/* Last updated */}
        <div className="fixed bottom-4 right-4 text-white/60 text-sm bg-black/30 backdrop-blur-md rounded-lg px-3 py-2">
          Last updated: {format(new Date(), 'HH:mm')}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
