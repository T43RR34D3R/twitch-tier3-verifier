"use client";

import { useEffect, useState, useCallback } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";

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

export default function ObsWeekCalendar() {
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

  const getWeekRange = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
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

  const weekDays = getWeekRange();

  if (loading) {
    return (
      <div className="min-h-screen bg-black/80 backdrop-blur-xl flex items-center justify-center">
        <div className="text-white text-2xl">Loading this week&apos;s events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-blue-900/95 backdrop-blur-xl p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📅 Week of {format(weekDays[0], 'MMMM d')} - {format(weekDays[6], 'MMMM d, yyyy')}
          </h1>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4 h-[calc(100vh-200px)]">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`bg-gray-800/60 backdrop-blur-md rounded-2xl border-2 p-4 flex flex-col ${
                  isDayToday 
                    ? 'border-purple-400 bg-purple-900/30' 
                    : 'border-gray-600/50'
                }`}
              >
                {/* Day Header */}
                <div className="text-center mb-4">
                  <div className={`text-lg font-semibold ${
                    isDayToday ? 'text-purple-300' : 'text-gray-300'
                  }`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-2xl font-bold ${
                    isDayToday ? 'text-white' : 'text-gray-200'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Events */}
                <div className="flex-1 space-y-2 overflow-hidden">
                  {dayEvents.slice(0, 6).map((event, index) => {
                    const showImage = event.image_url && dayEvents.length <= 3;
                    
                    return (
                      <div
                        key={event.id}
                        className="relative overflow-hidden rounded-lg shadow-lg border border-white/20"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                          animation: 'fadeInUp 0.6s ease-out forwards'
                        }}
                      >
                        {/* Background */}
                        {showImage ? (
                          <>
                            <div 
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${event.image_url})` }}
                            />
                            <div className="absolute inset-0 bg-black/50" />
                          </>
                        ) : (
                          <div 
                            className="absolute inset-0"
                            style={{ backgroundColor: event.background_color }}
                          />
                        )}

                        {/* Content */}
                        <div className="relative p-2">
                          <div 
                            className="text-sm font-semibold truncate"
                            style={{ 
                              color: showImage ? '#ffffff' : event.text_color,
                              textShadow: showImage ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                            }}
                          >
                            {event.title}
                          </div>
                          
                          {!event.is_all_day && event.start_time && (
                            <div 
                              className="text-xs opacity-90 mt-1"
                              style={{ 
                                color: showImage ? '#ffffff' : event.text_color,
                                textShadow: showImage ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                              }}
                            >
                              {event.start_time}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Show more indicator */}
                  {dayEvents.length > 6 && (
                    <div className="text-center py-2 text-gray-400 text-sm">
                      +{dayEvents.length - 6} more
                    </div>
                  )}

                  {/* Empty state */}
                  {dayEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today's Events Spotlight */}
        {(() => {
          const todaysEvents = getEventsForDate(new Date());
          if (todaysEvents.length === 0) return null;
          
          return (
            <div className="mt-8 bg-gray-800/80 backdrop-blur-md rounded-2xl border border-purple-400/50 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                🎯 Today&apos;s Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaysEvents.slice(0, 3).map((event, index) => (
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
                      <h3 
                        className="text-lg font-bold mb-2"
                        style={{ 
                          color: event.image_url ? '#ffffff' : event.text_color,
                          textShadow: event.image_url ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                        }}
                      >
                        {event.title}
                      </h3>
                      
                      <div 
                        className="flex items-center justify-between text-sm"
                        style={{ 
                          color: event.image_url ? '#ffffff' : event.text_color,
                          textShadow: event.image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                        }}
                      >
                        {event.is_all_day ? (
                          <span>All Day</span>
                        ) : (
                          <span>{event.start_time}</span>
                        )}
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
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
