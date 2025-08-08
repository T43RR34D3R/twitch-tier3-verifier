"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  image_url: string | null;
  twitch_category?: string;
  twitch_game_id?: string;
}

interface CalendarPanelSettings {
  enabled: boolean;
  showDescription: boolean;
  daysToShow: number;
}

export default function CalendarPanel() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [settings, setSettings] = useState<CalendarPanelSettings>({
    enabled: true,
    showDescription: true,
    daysToShow: 7
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/calendar-panel-settings');
        if (response.ok) {
          const settingsData = await response.json();
          setSettings(settingsData);
        }
      } catch (error) {
        console.error('Error loading calendar panel settings:', error);
      }
    };

    const loadCalendarData = async () => {
      try {
        // Get current week date range
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday

        const startMonth = startOfWeek.getMonth() + 1;
        const startYear = startOfWeek.getFullYear();

        const response = await fetch(`/api/calendar?month=${startMonth}&year=${startYear}`);
        if (!response.ok) {
          console.error('Failed to fetch calendar events');
          return;
        }

        const data = await response.json();
        
        // Filter events to current week only
        const weekEvents = data.filter((event: CalendarEvent) => {
          const eventDate = new Date(event.date);
          return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });

        setEvents(weekEvents);
      } catch (error) {
        console.error('Error loading calendar events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    loadCalendarData();
  }, []);

  // formatDate function removed as it was unused

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  if (!settings.enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">This Week&apos;s Schedule</h2>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays();
  const hasEvents = events.length > 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">This Week&apos;s Schedule</h2>
        <Link
          href="/calendar"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200"
        >
          View Full Calendar
        </Link>
      </div>

      {!hasEvents ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📅</div>
          <p className="text-gray-300 mb-4">No events scheduled for this week</p>
          <Link
            href="/calendar"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Add events in the full calendar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`relative min-h-[200px] rounded-lg overflow-hidden ${
                  isToday ? 'ring-2 ring-purple-400' : ''
                }`}
              >
                {/* Background - either event image or default gradient */}
                <div className="absolute inset-0">
                  {dayEvents.length > 0 && dayEvents[0].image_url ? (
                    <img
                      src={dayEvents[0].image_url}
                      alt={dayEvents[0].title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700"></div>
                  )}
                  {/* Dark overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>

                {/* Content */}
                <div className="relative h-full p-3 flex flex-col">
                  {/* Date header */}
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 mb-3">
                    <div className="text-white font-semibold text-sm">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-white/90 text-xs">
                      {day.getDate()}
                    </div>
                    {isToday && (
                      <div className="text-purple-300 text-xs font-medium">Today</div>
                    )}
                  </div>

                  {/* Events */}
                  <div className="flex-1 space-y-2">
                    {dayEvents.length === 0 ? (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
                        <div className="text-white/60 text-xs">No events</div>
                      </div>
                    ) : (
                      dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/10"
                        >
                          <div className="text-white font-medium text-sm mb-1 line-clamp-2">
                            {event.title}
                          </div>
                          <div className="text-white/80 text-xs mb-1">
                            {formatTime(event.time)}
                          </div>
                          {settings.showDescription && event.description && (
                            <div className="text-white/70 text-xs line-clamp-2">
                              {event.description}
                            </div>
                          )}
                          {event.twitch_category && (
                            <div className="text-purple-300 text-xs mt-1 truncate">
                              🎮 {event.twitch_category}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    
                    {dayEvents.length > 2 && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 text-center">
                        <div className="text-white/60 text-xs">
                          +{dayEvents.length - 2} more
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasEvents && (
        <div className="mt-4 text-center">
          <Link
            href="/calendar"
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            View all events in full calendar →
          </Link>
        </div>
      )}
    </div>
  );
}
