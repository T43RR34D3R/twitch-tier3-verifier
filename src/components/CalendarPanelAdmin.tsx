"use client";

import { useState, useEffect } from 'react';

interface CalendarPanelSettings {
  enabled: boolean;
  showDescription: boolean;
  daysToShow: number;
}

interface CalendarPanelAdminProps {
  onSettingsChange?: (settings: CalendarPanelSettings) => void;
}

export default function CalendarPanelAdmin({ onSettingsChange }: CalendarPanelAdminProps) {
  const [settings, setSettings] = useState<CalendarPanelSettings>({
    enabled: true,
    showDescription: true,
    daysToShow: 7
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/calendar-panel-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading calendar panel settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/calendar-panel-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('Calendar panel settings saved successfully!');
        onSettingsChange?.(settings);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save calendar panel settings');
      }
    } catch (error) {
      console.error('Error saving calendar panel settings:', error);
      setMessage('Error saving calendar panel settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof CalendarPanelSettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-4">📅 Calendar Panel Settings</h3>
      
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes('Error') || message.includes('Failed')
            ? 'bg-red-500/20 text-red-200 border border-red-500/30'
            : 'bg-green-500/20 text-green-200 border border-green-500/30'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Enable Calendar Panel</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Show Description */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Show Event Descriptions</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.showDescription}
              onChange={(e) => updateSetting('showDescription', e.target.checked)}
              disabled={!settings.enabled}
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50"></div>
          </label>
        </div>

        {/* Days to Show */}
        <div className="space-y-2">
          <label className="text-white font-medium">Days to Display</label>
          <select
            value={settings.daysToShow}
            onChange={(e) => updateSetting('daysToShow', parseInt(e.target.value))}
            disabled={!settings.enabled}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50"
          >
            <option value={3}>3 Days</option>
            <option value={7}>Full Week (7 Days)</option>
            <option value={14}>2 Weeks</option>
          </select>
          <p className="text-gray-400 text-sm">
            Current week view shows 7 days (Sunday-Saturday)
          </p>
        </div>

        {/* Preview Info */}
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">Preview:</h4>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Shows current week with background images from events</li>
            <li>• Glass effect overlay on text for better readability</li>
            <li>• Highlights today with purple ring</li>
            <li>• Links to full calendar for more details</li>
            <li>• Shows up to 2 events per day with &quot;View more&quot; indicator</li>
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={saveSettings}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors duration-200"
        >
          {loading ? 'Saving...' : 'Save Calendar Panel Settings'}
        </button>

        {/* Additional Options */}
        <div className="border-t border-white/20 pt-4">
          <h4 className="text-white font-medium mb-3">Quick Actions:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg text-center transition-colors duration-200"
            >
              Manage Events
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors duration-200"
            >
              Preview Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
