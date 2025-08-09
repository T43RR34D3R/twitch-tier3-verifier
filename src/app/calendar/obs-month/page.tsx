"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

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

export default function ObsMonthCalendar() {
  const [currentDate] = useState(new Date());
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

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    ).sort((a, b) => {
      if (a.is_all_day && !b.is_all_day) return -1;
      if (!a.is_all_day && b.is_all_day) return 1;
      
      if (!a.is_all_day && !b.is_all_day) {
        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      }
      
      return 0;
    });
  };

  const days = getDaysInMonth();
  const firstDayOfWeek = startOfMonth(currentDate).getDay();

  if (loading) {
    return (
      <div className="min-h-screen bg-black/80 backdrop-blur-xl flex items-center justify-center">
        <div className="text-white text-2xl">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            📅 {format(currentDate, 'MMMM yyyy')}
          </h1>
        </div>

        {/* Calendar Grid */}
        <div className="bg-gray-800/60 backdrop-blur-md rounded-3xl p-6 border border-gray-600/50">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
              <div key={day} className="text-center text-purple-200 font-bold py-3 text-lg">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="h-32 lg:h-36"></div>
            ))}
            
            {/* Days of the month */}
            {days.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day);
              const isDayToday = isToday(day);
              const backgroundEvent = dayEvents.find(event => event.image_url && event.image_url.trim() !== '');
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-32 lg:min-h-36 border-2 rounded-xl overflow-hidden relative transition-all duration-200 ${
                    isDayToday 
                      ? 'border-purple-400 shadow-lg shadow-purple-400/20' 
                      : 'border-gray-600/50'
                  } ${
                    !isSameMonth(day, currentDate) ? 'opacity-30' : ''
                  }`}
                  style={{
                    animationDelay: `${dayIndex * 0.02}s`,
                    animation: 'fadeInScale 0.6s ease-out forwards'
                  }}
                >
                  {/* Background Image */}
                  {backgroundEvent?.image_url ? (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${backgroundEvent.image_url})` }}
                      />
                      <div className="absolute inset-0 bg-black/30" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 ${
                      isDayToday 
                        ? 'bg-purple-900/20' 
                        : 'bg-gray-800/50'
                    }`} />
                  )}
                  
                  {/* Content */}
                  <div className="relative h-full p-2 flex flex-col">
                    {/* Day Number */}
                    <div className={`inline-block w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-lg font-bold mb-2 shadow-lg ${
                      backgroundEvent?.image_url 
                        ? 'text-white drop-shadow-lg' 
                        : isDayToday 
                          ? 'text-purple-300 bg-purple-600/30' 
                          : 'text-gray-200'
                    }`}>
                      {format(day, 'd')}
                    </div>

                    {/* Events */}
                    <div className="flex-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const showImage = event.image_url && dayEvents.length <= 2;
                        
                        return (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded-md cursor-pointer transition-all duration-200 hover:scale-105 border border-white/10"
                            style={{
                              backgroundColor: showImage ? 'rgba(255,255,255,0.15)' : event.background_color,
                              color: showImage ? '#ffffff' : event.text_color,
                              textShadow: showImage ? '0 1px 2px rgba(0,0,0,0.8)' : 'none',
                              backdropFilter: showImage ? 'blur(4px)' : 'none'
                            }}
                          >
                            <div className="font-semibold truncate">
                              {event.title}
                            </div>
                            {!event.is_all_day && event.start_time && (
                              <div className="opacity-90 text-xs">
                                {event.start_time}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* More events indicator */}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-center py-1 text-gray-300 bg-black/20 backdrop-blur-md rounded border border-white/10">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Highlights */}
        {(() => {
          const upcomingEvents = events
            .filter(event => new Date(event.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 6);

          if (upcomingEvents.length === 0) return null;

          return (
            <div className="mt-8 bg-gray-800/80 backdrop-blur-md rounded-2xl border border-purple-400/50 p-6">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                🎯 Upcoming Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="relative overflow-hidden rounded-xl shadow-lg border border-white/20"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: 'slideInFromBottom 0.8s ease-out forwards'
                    }}
                  >
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

                    <div className="relative p-4">
                      <div className="text-sm font-semibold mb-2" style={{ 
                        color: event.image_url ? '#ffffff' : event.text_color,
                        textShadow: event.image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                      }}>
                        {format(new Date(event.date), 'MMM d')}
                      </div>
                      
                      <h3 className="text-lg font-bold mb-2" style={{ 
                        color: event.image_url ? '#ffffff' : event.text_color,
                        textShadow: event.image_url ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                      }}>
                        {event.title}
                      </h3>
                      
                      <div className="text-sm" style={{ 
                        color: event.image_url ? '#ffffff' : event.text_color,
                        textShadow: event.image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                      }}>
                        {event.is_all_day ? 'All Day' : event.start_time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
