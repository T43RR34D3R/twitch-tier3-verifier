"use client";

import { useEffect, useState, useCallback } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl opacity-70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`empty-${i}`}></div>
        ))}
        
        {/* Days of the month */}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          
          return (
            <div key={day.toISOString()} className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => {
                const showImage = event.image_url && dayEvents.length <= 2;
                
                return (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded-md transition-all duration-200"
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
            </div>
          );
        })}
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
