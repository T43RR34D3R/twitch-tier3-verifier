"use client";

import { useEffect, useState, useCallback } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl opacity-70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDate(day);
          
          return (
            <div key={day.toISOString()} className="space-y-2">
              {dayEvents.slice(0, 6).map((event, index) => {
                const showImage = event.image_url && dayEvents.length <= 3;
                
                return (
                  <div
                    key={event.id}
                    className="relative overflow-hidden rounded-lg shadow-lg"
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
            </div>
          );
        })}
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
