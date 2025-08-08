"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import CustomBackground from "../../components/CustomBackground";

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

interface EditingEvent {
  id?: number;
  date: string;
  title: string;
  description: string;
  image_url: string;
  background_color: string;
  text_color: string;
  is_all_day: boolean;
  start_time: string;
  end_time: string;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!session?.user) {
      setIsAdmin(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/check');
      const data = await response.json();
      setIsAdmin(data.isAdmin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }, [session?.user]);

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

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const startEditingNewEvent = (date: Date) => {
    if (!isAdmin) return;
    
    // Store the date in the user's timezone
    const dateString = format(date, 'yyyy-MM-dd');
    setEditingDate(dateString);
    setEditingEvent({
      date: dateString,
      title: '',
      description: '',
      image_url: '',
      background_color: '#6366f1',
      text_color: '#ffffff',
      is_all_day: true,
      start_time: '09:00',
      end_time: '10:00'
    });
  };

  const startEditingEvent = (event: CalendarEvent) => {
    if (!isAdmin) return;
    
    setEditingDate(event.date);
    setEditingEvent({
      id: event.id,
      date: event.date,
      title: event.title,
      description: event.description || '',
      image_url: event.image_url || '',
      background_color: event.background_color,
      text_color: event.text_color,
      is_all_day: event.is_all_day,
      start_time: event.start_time || '09:00',
      end_time: event.end_time || '10:00'
    });
  };

  const cancelEditing = () => {
    setEditingEvent(null);
    setEditingDate(null);
  };

  const saveEvent = async () => {
    if (!editingEvent) return;
    
    setSaving(true);
    try {
      const method = editingEvent.id ? 'PUT' : 'POST';
      const response = await fetch('/api/calendar', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEvent)
      });

      const data = await response.json();
      
      if (response.ok) {
        await loadEvents();
        cancelEditing();
      } else {
        alert(data.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!isAdmin || !confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`/api/calendar?id=${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadEvents();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/calendar/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setEditingEvent(prev => 
          prev ? {...prev, image_url: data.url} : null
        );
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }

    // Reset file input
    event.target.value = '';
  };

  if (loading) {
    return (
      <CustomBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="text-xl text-white flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading Calendar...</span>
            </div>
          </div>
        </div>
      </CustomBackground>
    );
  }

  const days = getDaysInMonth();
  const firstDayOfWeek = startOfMonth(currentDate).getDay();
  
  return (
    <CustomBackground>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">
              📅 {format(currentDate, 'MMMM yyyy')}
            </h1>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevMonth}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={handleToday}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="text-blue-300 text-sm">
                ✏️ <strong>Admin Mode:</strong> Click on any date to add events, or click existing events to edit them.
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-gray-300 font-semibold py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} className="h-24"></div>
              ))}
              
              {/* Days of the month */}
              {days.map(day => {
                const dayEvents = getEventsForDate(day);
                const isToday = isSameDay(day, new Date());
                const dateString = format(day, 'yyyy-MM-dd');
                const isEditing = editingDate === dateString;
                
                // Find the first event with an image for background
                const backgroundEvent = dayEvents.find(event => event.image_url);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 border rounded-lg overflow-hidden relative transition-all duration-200 ${
                      isToday 
                        ? 'border-purple-500' 
                        : 'border-gray-600'
                    } ${
                      isAdmin ? 'cursor-pointer hover:border-blue-400' : ''
                    } ${
                      !isSameMonth(day, currentDate) ? 'opacity-30' : ''
                    }`}
                    onClick={() => isAdmin && !isEditing ? startEditingNewEvent(day) : undefined}
                  >
                    {/* Background Image */}
                    {backgroundEvent?.image_url ? (
                      <>
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${backgroundEvent.image_url})`
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20" />
                      </>
                    ) : (
                      <div className={`absolute inset-0 ${
                        isToday 
                          ? 'bg-purple-900/20' 
                          : 'bg-gray-800/50'
                      }`} />
                    )}
                    
                    {/* Glass morphism overlay for content */}
                    <div className="relative h-full p-2">
                      {/* Day Number with glass effect */}
                      <div className={`inline-block px-2 py-1 rounded-md backdrop-blur-md bg-white/10 border border-white/20 text-sm font-bold mb-1 shadow-lg ${
                        backgroundEvent?.image_url 
                          ? 'text-white drop-shadow-lg' 
                          : isToday 
                            ? 'text-purple-300' 
                            : 'text-gray-300'
                      }`}>
                        {format(day, 'd')}
                      </div>

                      {/* Events with glass effect */}
                      <div className="space-y-1">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`text-xs p-2 rounded-md cursor-pointer transition-all duration-200 hover:scale-105 ${
                              backgroundEvent?.image_url 
                                ? 'backdrop-blur-md bg-white/15 border border-white/25 text-white drop-shadow-md hover:bg-white/20'
                                : 'hover:opacity-80'
                            }`}
                            style={{
                              backgroundColor: backgroundEvent?.image_url ? undefined : event.background_color,
                              color: backgroundEvent?.image_url ? undefined : event.text_color
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAdmin) {
                                startEditingEvent(event);
                              } else {
                                setSelectedEvent(event);
                                setShowEventDetail(true);
                              }
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {!event.is_all_day && event.start_time && (
                              <div className="opacity-75 text-xs">{event.start_time}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Editor */}
                    {isEditing && (
                      <div 
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={cancelEditing}
                      >
                        <div 
                          className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-xl font-bold text-white mb-4">
                            {editingEvent?.id ? 'Edit Event' : 'New Event'} - {format(day, 'MMM d, yyyy')}
                          </h3>

                          <div className="space-y-4">
                            {/* Title */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Title *
                              </label>
                              <input
                                type="text"
                                value={editingEvent?.title || ''}
                                onChange={(e) => setEditingEvent(prev => 
                                  prev ? {...prev, title: e.target.value} : null
                                )}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Event title"
                              />
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Description
                              </label>
                              <textarea
                                value={editingEvent?.description || ''}
                                onChange={(e) => setEditingEvent(prev => 
                                  prev ? {...prev, description: e.target.value} : null
                                )}
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Event description"
                              />
                            </div>

                            {/* Image Upload */}
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Event Image
                              </label>
                              
                              {/* Current Image Preview */}
                              {editingEvent?.image_url && (
                                <div className="mb-2">
                                  <img
                                    src={editingEvent.image_url}
                                    alt="Event preview"
                                    className="w-full h-32 object-cover rounded-lg border border-gray-600"
                                  />
                                </div>
                              )}
                              
                              {/* Image URL Input */}
                              <input
                                type="url"
                                value={editingEvent?.image_url || ''}
                                onChange={(e) => setEditingEvent(prev => 
                                  prev ? {...prev, image_url: e.target.value} : null
                                )}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                                placeholder="https://example.com/image.jpg or upload below"
                              />
                              
                              {/* File Upload */}
                              <div className="flex items-center space-x-2">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  id="image-upload"
                                />
                                <label
                                  htmlFor="image-upload"
                                  className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  📁 Upload Image
                                </label>
                                <span className="text-xs text-gray-400">
                                  Max 5MB (JPEG, PNG, GIF, WebP)
                                </span>
                              </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Background Color
                                </label>
                                <input
                                  type="color"
                                  value={editingEvent?.background_color || '#6366f1'}
                                  onChange={(e) => setEditingEvent(prev => 
                                    prev ? {...prev, background_color: e.target.value} : null
                                  )}
                                  className="w-full h-10 rounded-lg border border-gray-600"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Text Color
                                </label>
                                <input
                                  type="color"
                                  value={editingEvent?.text_color || '#ffffff'}
                                  onChange={(e) => setEditingEvent(prev => 
                                    prev ? {...prev, text_color: e.target.value} : null
                                  )}
                                  className="w-full h-10 rounded-lg border border-gray-600"
                                />
                              </div>
                            </div>

                            {/* All Day Toggle */}
                            <div>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={editingEvent?.is_all_day || false}
                                  onChange={(e) => setEditingEvent(prev => 
                                    prev ? {...prev, is_all_day: e.target.checked} : null
                                  )}
                                  className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-gray-300">All Day Event</span>
                              </label>
                            </div>

                            {/* Time Range */}
                            {!editingEvent?.is_all_day && (
                              <div>
                                <div className="mb-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                                  <div className="text-yellow-300 text-xs">
                                    ⚠️ <strong>Timezone Info:</strong> Times are shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Other users will see these times as-is without conversion.
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                      Start Time (Local)
                                    </label>
                                    <input
                                      type="time"
                                      value={editingEvent?.start_time || '09:00'}
                                      onChange={(e) => setEditingEvent(prev => 
                                        prev ? {...prev, start_time: e.target.value} : null
                                      )}
                                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                      End Time (Local)
                                    </label>
                                    <input
                                      type="time"
                                      value={editingEvent?.end_time || '10:00'}
                                      onChange={(e) => setEditingEvent(prev => 
                                        prev ? {...prev, end_time: e.target.value} : null
                                      )}
                                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-4">
                              <div>
                                {editingEvent?.id && (
                                  <button
                                    onClick={() => deleteEvent(editingEvent.id!)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <button
                                  onClick={cancelEditing}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={saveEvent}
                                  disabled={saving || !editingEvent?.title}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 text-center">
            <div className="text-gray-400 text-sm">
              {isAdmin 
                ? "Click on any date to add events, or click existing events to edit them."
                : "Click on events to view details."
              }
            </div>
          </div>
        </div>
        </div>

        {/* Event Detail Modal */}
        {showEventDetail && selectedEvent && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowEventDetail(false)}
          >
            <div 
              className="bg-gray-800 rounded-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Full screen image if present */}
              {selectedEvent.image_url && (
                <div className="relative">
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-t-xl"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-t-xl" />
                  <button
                    onClick={() => setShowEventDetail(false)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div className="p-6">
                {/* Close button when no image */}
                {!selectedEvent.image_url && (
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setShowEventDetail(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {/* Event Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedEvent.title}</h3>
                    <div className="text-purple-300 text-sm">
                      📅 {format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                  
                  {/* Time info */}
                  {!selectedEvent.is_all_day && selectedEvent.start_time && (
                    <div className="text-gray-300">
                      <span className="text-blue-300">🕐 Time:</span> {selectedEvent.start_time}
                      {selectedEvent.end_time && selectedEvent.end_time !== selectedEvent.start_time && (
                        <> - {selectedEvent.end_time}</>
                      )}
                    </div>
                  )}
                  
                  {selectedEvent.is_all_day && (
                    <div className="text-gray-300">
                      <span className="text-blue-300">📅 All Day Event</span>
                    </div>
                  )}
                  
                  {/* Description */}
                  {selectedEvent.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Description:</h4>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Event created info */}
                  <div className="pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500">
                      Created by {selectedEvent.created_by} on {format(new Date(selectedEvent.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CustomBackground>
  );
}
