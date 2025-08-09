import React, { useEffect, useState, useCallback } from 'react';

export default function ObsOneDayCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
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

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

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
    return null;
  }

  return (
    <div style={{ background: 'transparent', padding: '32px', minHeight: '100vh' }}>
      {hasEvents ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {todaysEvents.map((event, index) => (
            <div
              key={event.id}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                animationDelay: `${index * 0.1}s`,
                animation: 'slideInFromLeft 0.8s ease-out forwards'
              }}
            >
              {/* Background */}
              {event.image_url ? (
                <>
                  <div 
                    style={{
                      position: 'absolute',
                      inset: '0',
                      backgroundImage: `url(${event.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: '0',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)'
                  }} />
                </>
              ) : (
                <div 
                  style={{
                    position: 'absolute',
                    inset: '0',
                    backgroundColor: event.background_color
                  }}
                />
              )}

              {/* Content */}
              <div style={{ position: 'relative', padding: '24px', backdropFilter: 'blur(4px)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: '1' }}>
                    <h2 
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: event.image_url ? '#ffffff' : event.text_color,
                        textShadow: event.image_url ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                      }}
                    >
                      {event.title}
                    </h2>
                    
                    {event.description && (
                      <p 
                        style={{
                          fontSize: '1.125rem',
                          marginBottom: '12px',
                          opacity: '0.9',
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
                    style={{
                      marginLeft: '16px',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      backdropFilter: 'blur(16px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: event.image_url ? '#ffffff' : event.text_color,
                      textShadow: event.image_url ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
                    }}
                  >
                    {event.is_all_day ? (
                      <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>All Day</div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                          {event.start_time}
                        </div>
                        {event.end_time && event.end_time !== event.start_time && (
                          <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>
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
      ) : null}

      <style jsx global>{`
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
        
        html, body, #__next, body > div:first-child {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }
        
        html {
          --background: transparent !important;
          --foreground: white !important;
        }
        
        body {
          color: white !important;
        }
      `}</style>
    </div>
  );
}
