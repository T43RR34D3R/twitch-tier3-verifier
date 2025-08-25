'use client';

import React, { useState, useEffect } from 'react';

interface SubathonSettings {
  id: number;
  tier1_sub_time: number;
  tier2_sub_time: number;
  tier3_sub_time: number;
  tier1_gift_time: number;
  tier2_gift_time: number;
  tier3_gift_time: number;
  tier1_resub_time: number;
  tier2_resub_time: number;
  tier3_resub_time: number;
  follow_time: number;
  bits_per_second: number;
  min_bits_time: number;
  max_bits_time: number;
  raid_time_per_viewer: number;
  min_raid_time: number;
  max_raid_time: number;
  host_time: number;
  // Merch purchase settings
  merch_enabled: boolean;
  merch_base_reward_minutes: number;
  merch_price_threshold: number;
  merch_bonus_50_minutes: number;
  merch_bonus_100_minutes: number;
  enabled: boolean;
}

export default function SubathonSettingsPage() {
  const [settings, setSettings] = useState<SubathonSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [eventSubStatus, setEventSubStatus] = useState<Array<{id: string; status: string; type: string}>>([]);
  const [eventSubLoading, setEventSubLoading] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchEventSubStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/subathon-settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/subathon-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (result.success) {
        setMessage('✅ Settings saved successfully!');
        setSettings(result.settings);
      } else {
        setMessage('❌ Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Error saving settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updateSetting = (field: keyof SubathonSettings, value: number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const fetchEventSubStatus = async () => {
    try {
      const response = await fetch('/api/twitch/eventsub-manage');
      const data = await response.json();
      if (data.success) {
        setEventSubStatus(data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching EventSub status:', error);
    }
  };

  const setupEventSub = async () => {
    setEventSubLoading(true);
    try {
      const response = await fetch('/api/twitch/eventsub-manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'setup' }),
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage('✅ EventSub subscriptions set up successfully!');
        fetchEventSubStatus();
      } else {
        setMessage('❌ Failed to set up EventSub subscriptions');
      }
    } catch (error) {
      console.error('EventSub setup error:', error);
      setMessage('❌ Error setting up EventSub');
    } finally {
      setEventSubLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const cleanupEventSub = async () => {
    setEventSubLoading(true);
    try {
      const response = await fetch('/api/twitch/eventsub-manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanup' }),
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage('✅ EventSub subscriptions cleaned up!');
        fetchEventSubStatus();
      } else {
        setMessage('❌ Failed to cleanup EventSub subscriptions');
      }
    } catch (error) {
      console.error('EventSub cleanup error:', error);
      setMessage('❌ Error cleaning up EventSub');
    } finally {
      setEventSubLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const simulateEvent = async (eventType: string, eventData: Record<string, unknown> = {}) => {
    setSimulationLoading(true);
    try {
      const response = await fetch('/api/simulate-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType, ...eventData }),
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Simulated: ${result.message}`);
      } else {
        setMessage(`❌ Simulation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      setMessage('❌ Simulation error');
    } finally {
      setSimulationLoading(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const testAddTime = async (seconds: number, message: string) => {
    try {
      const response = await fetch('/api/subathon-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'addCustomTime', 
          time: seconds,
          customMessage: message 
        }),
      });
      
      if (response.ok) {
        setMessage(`✅ Test: ${message}`);
      } else {
        setMessage('❌ Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      setMessage('❌ Test error');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="error">Failed to load settings</div>;
  }

  return (
    <div className="settings-container">
      <style jsx>{`
        .settings-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #1a1a1a;
          color: #e0e0e0;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .header h1 {
          font-size: 2.5rem;
          color: #fff;
          margin-bottom: 10px;
        }

        .master-toggle {
          background: rgba(30, 30, 40, 0.8);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 30px;
          text-align: center;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
          margin-bottom: 30px;
        }

        .settings-section {
          background: rgba(30, 30, 40, 0.8);
          border-radius: 15px;
          padding: 25px;
          border: 1px solid rgba(120, 119, 198, 0.2);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 20px;
          color: #fff;
          border-bottom: 2px solid rgba(120, 119, 198, 0.3);
          padding-bottom: 10px;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding: 10px;
          background: rgba(20, 20, 30, 0.5);
          border-radius: 8px;
        }

        .setting-label {
          flex: 1;
          font-weight: 500;
        }

        .setting-value {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .time-input {
          width: 80px;
          padding: 8px;
          background: rgba(40, 40, 50, 0.8);
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 6px;
          color: #e0e0e0;
          text-align: center;
        }

        .decimal-input {
          width: 100px;
          padding: 8px;
          background: rgba(40, 40, 50, 0.8);
          border: 1px solid rgba(120, 119, 198, 0.3);
          border-radius: 6px;
          color: #e0e0e0;
          text-align: center;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #7877c6;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .time-display {
          font-size: 0.9rem;
          color: #888;
          margin-left: 10px;
        }

        .test-btn {
          background: rgba(120, 119, 198, 0.2);
          border: 1px solid rgba(120, 119, 198, 0.5);
          border-radius: 6px;
          padding: 6px 12px;
          color: #e0e0e0;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.3s ease;
        }

        .test-btn:hover {
          background: rgba(120, 119, 198, 0.3);
        }

        .action-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 30px;
        }

        .save-btn {
          background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
          border: none;
          border-radius: 12px;
          padding: 15px 30px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
        }

        .save-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .reset-btn {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          border: none;
          border-radius: 12px;
          padding: 15px 30px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        }

        .reset-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
        }

        .message {
          text-align: center;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid rgba(76, 175, 80, 0.5);
          color: #4caf50;
        }

        .message.error {
          background: rgba(244, 67, 54, 0.2);
          border: 1px solid rgba(244, 67, 54, 0.5);
          color: #f44336;
        }

        .loading, .error {
          text-align: center;
          padding: 50px;
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>

      <div className="header">
        <h1>🎮 Subathon Timer Settings</h1>
        <p>Configure how much time each Twitch event adds to your subathon timer</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="master-toggle">
        <h3>Master Control</h3>
        <div className="setting-row">
          <span className="setting-label">Enable Automatic Timer Additions</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* EventSub Management */}
      <div className="master-toggle">
        <h3>🔗 Twitch EventSub Webhooks</h3>
        <p style={{ margin: '10px 0', opacity: 0.8, fontSize: '0.9rem' }}>
          EventSub webhooks automatically detect when viewers subscribe, follow, cheer, etc.
        </p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '15px' }}>
          <button 
            className="test-btn"
            onClick={setupEventSub}
            disabled={eventSubLoading}
            style={{ padding: '10px 20px', fontSize: '1rem' }}
          >
            {eventSubLoading ? 'Setting up...' : '🚀 Setup EventSub'}
          </button>
          
          <button 
            className="test-btn"
            onClick={cleanupEventSub}
            disabled={eventSubLoading}
            style={{ padding: '10px 20px', fontSize: '1rem', background: 'rgba(231, 76, 60, 0.2)' }}
          >
            {eventSubLoading ? 'Cleaning...' : '🧹 Cleanup EventSub'}
          </button>
          
          <button 
            className="test-btn"
            onClick={fetchEventSubStatus}
            style={{ padding: '10px 20px', fontSize: '1rem' }}
          >
            🔄 Refresh Status
          </button>
        </div>
        
        {eventSubStatus.length > 0 && (
          <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(20, 20, 30, 0.5)', borderRadius: '8px' }}>
            <h4>Active Subscriptions:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
              {eventSubStatus.map((sub, index) => (
                <div key={index} style={{ 
                  padding: '8px 12px', 
                  background: sub.status === 'enabled' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)', 
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{sub.type}</div>
                  <div style={{ opacity: 0.8 }}>Status: {sub.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="settings-grid">
        {/* Subscriptions */}
        <div className="settings-section">
          <h3 className="section-title">💎 New Subscriptions</h3>
          
          <div className="setting-row">
            <span className="setting-label">Tier 1 Sub ($4.99)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier1_sub_time}
                onChange={(e) => updateSetting('tier1_sub_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier1_sub_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier1_sub_time, '🎉 Test Tier 1 Sub!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 2 Sub ($9.99)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier2_sub_time}
                onChange={(e) => updateSetting('tier2_sub_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier2_sub_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier2_sub_time, '🎉 Test Tier 2 Sub!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 3 Sub ($24.99)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier3_sub_time}
                onChange={(e) => updateSetting('tier3_sub_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier3_sub_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier3_sub_time, '🎉 Test Tier 3 Sub!')}
              >
                Test
              </button>
            </div>
          </div>
        </div>

        {/* Fourthwall Merch Purchases */}
        <div className="settings-section">
          <h3 className="section-title">🛒 Fourthwall Merch Purchases</h3>
          
          <div className="setting-row">
            <span className="setting-label">Enable Merch Rewards</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.merch_enabled || false}
                onChange={(e) => updateSetting('merch_enabled', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="setting-row">
            <span className="setting-label">Base Reward (minutes per $)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.merch_base_reward_minutes || 5}
                onChange={(e) => updateSetting('merch_base_reward_minutes', parseInt(e.target.value) || 0)}
                min="0"
                max="60"
              />
              <span className="time-display">$20 = {formatTime((settings.merch_base_reward_minutes || 5) * 2 * 60)}</span>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Price Threshold ($)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.merch_price_threshold || 10}
                onChange={(e) => updateSetting('merch_price_threshold', parseInt(e.target.value) || 1)}
                min="1"
              />
              <span className="time-display">Minimum $ for rewards</span>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">$50+ Bonus (minutes)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.merch_bonus_50_minutes || 10}
                onChange={(e) => updateSetting('merch_bonus_50_minutes', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime((settings.merch_bonus_50_minutes || 10) * 60)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(((50 / (settings.merch_price_threshold || 10)) * (settings.merch_base_reward_minutes || 5) + (settings.merch_bonus_50_minutes || 10)) * 60, '🛒 Test $50 Merch Purchase!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">$100+ Bonus (minutes)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.merch_bonus_100_minutes || 30}
                onChange={(e) => updateSetting('merch_bonus_100_minutes', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime((settings.merch_bonus_100_minutes || 30) * 60)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(((100 / (settings.merch_price_threshold || 10)) * (settings.merch_base_reward_minutes || 5) + (settings.merch_bonus_50_minutes || 10) + (settings.merch_bonus_100_minutes || 30)) * 60, '🛒 Test $100 Merch Purchase!')}
              >
                Test
              </button>
            </div>
          </div>

          <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(20, 20, 30, 0.5)', borderRadius: '6px', fontSize: '0.8rem', opacity: 0.8 }}>
            <div><strong>💡 Webhook URL:</strong> https://buckfoozle.com/api/fourthwall/webhook</div>
            <div style={{ marginTop: '5px' }}><strong>🔒 Environment Variable:</strong> FOURTHWALL_WEBHOOK_SECRET</div>
          </div>
        </div>

        {/* Gift Subscriptions */}
        <div className="settings-section">
          <h3 className="section-title">🎁 Gift Subscriptions</h3>
          
          <div className="setting-row">
            <span className="setting-label">Tier 1 Gift (per gift)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier1_gift_time}
                onChange={(e) => updateSetting('tier1_gift_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier1_gift_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier1_gift_time, '🎁 Test Gift Sub!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 2 Gift (per gift)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier2_gift_time}
                onChange={(e) => updateSetting('tier2_gift_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier2_gift_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier2_gift_time, '🎁 Test Tier 2 Gift!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 3 Gift (per gift)</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier3_gift_time}
                onChange={(e) => updateSetting('tier3_gift_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier3_gift_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier3_gift_time, '🎁 Test Tier 3 Gift!')}
              >
                Test
              </button>
            </div>
          </div>
        </div>

        {/* Resubscriptions */}
        <div className="settings-section">
          <h3 className="section-title">🔄 Resubscriptions</h3>
          
          <div className="setting-row">
            <span className="setting-label">Tier 1 Resub</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier1_resub_time}
                onChange={(e) => updateSetting('tier1_resub_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier1_resub_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier1_resub_time, '🔄 Test Resub!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 2 Resub</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier2_resub_time}
                onChange={(e) => updateSetting('tier2_resub_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier2_resub_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier2_resub_time, '🔄 Test Tier 2 Resub!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 3 Resub</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.tier3_resub_time}
                onChange={(e) => updateSetting('tier3_resub_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.tier3_resub_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.tier3_resub_time, '🔄 Test Tier 3 Resub!')}
              >
                Test
              </button>
            </div>
          </div>
        </div>

        {/* Bits & Cheers */}
        <div className="settings-section">
          <h3 className="section-title">💎 Bits & Cheers</h3>
          
          <div className="setting-row">
            <span className="setting-label">Seconds per Bit</span>
            <div className="setting-value">
              <input
                type="number"
                step="0.01"
                className="decimal-input"
                value={settings.bits_per_second}
                onChange={(e) => updateSetting('bits_per_second', parseFloat(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">100 bits = {formatTime(Math.floor(100 * settings.bits_per_second))}</span>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Minimum Bits Time</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.min_bits_time}
                onChange={(e) => updateSetting('min_bits_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.min_bits_time)}</span>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Maximum Bits Time</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.max_bits_time}
                onChange={(e) => updateSetting('max_bits_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.max_bits_time)}</span>
            </div>
          </div>
        </div>

        {/* Raids */}
        <div className="settings-section">
          <h3 className="section-title">🚀 Raids</h3>
          
          <div className="setting-row">
            <span className="setting-label">Seconds per Raider</span>
            <div className="setting-value">
              <input
                type="number"
                step="0.1"
                className="decimal-input"
                value={settings.raid_time_per_viewer}
                onChange={(e) => updateSetting('raid_time_per_viewer', parseFloat(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">100 raiders = {formatTime(Math.floor(100 * settings.raid_time_per_viewer))}</span>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Minimum Raid Time</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.min_raid_time}
                onChange={(e) => updateSetting('min_raid_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.min_raid_time)}</span>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Maximum Raid Time</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.max_raid_time}
                onChange={(e) => updateSetting('max_raid_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.max_raid_time)}</span>
            </div>
          </div>
        </div>

        {/* Other Events */}
        <div className="settings-section">
          <h3 className="section-title">📺 Other Events</h3>
          
          <div className="setting-row">
            <span className="setting-label">New Follow</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.follow_time}
                onChange={(e) => updateSetting('follow_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.follow_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.follow_time, '👋 Test Follow!')}
              >
                Test
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Host</span>
            <div className="setting-value">
              <input
                type="number"
                className="time-input"
                value={settings.host_time}
                onChange={(e) => updateSetting('host_time', parseInt(e.target.value) || 0)}
                min="0"
              />
              <span className="time-display">{formatTime(settings.host_time)}</span>
              <button 
                className="test-btn"
                onClick={() => testAddTime(settings.host_time, '📺 Test Host!')}
              >
                Test
              </button>
            </div>
          </div>
        </div>

        {/* Event Simulation */}
        <div className="settings-section">
          <h3 className="section-title">🎭 Event Simulation</h3>
          <p style={{ margin: '0 0 15px 0', opacity: 0.8, fontSize: '0.9rem' }}>
            Test how different Twitch events affect your timer
          </p>
          
          <div className="setting-row">
            <span className="setting-label">Tier 1 Subscription</span>
            <button 
              className="test-btn"
              onClick={() => simulateEvent('subscription', { tier: '1000', user_name: 'TestViewer1' })}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              🎉 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">Tier 3 Subscription</span>
            <button 
              className="test-btn"
              onClick={() => simulateEvent('subscription', { tier: '3000', user_name: 'BigSupporter' })}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              💎 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">5x Gift Subs (Tier 1)</span>
            <button 
              className="test-btn"
              onClick={() => simulateEvent('gift_subscription', { tier: '1000', total: 5, user_name: 'GenerousGifter' })}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              🎁 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">500 Bits Cheer</span>
            <button 
              className="test-btn"
              onClick={() => simulateEvent('cheer', { bits: 500, user_name: 'CheerMaster' })}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              💎 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">50 Person Raid</span>
            <button 
              className="test-btn"
              onClick={() => simulateEvent('raid', { viewers: 50, from_broadcaster_user_name: 'FriendlyStreamer' })}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              🚀 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">New Follow</span>
            <button 
              className="test-btn"
              onClick={() => simulateEvent('follow', { user_name: 'NewFollower' })}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              👋 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">$25 Merch Purchase</span>
            <button 
              className="test-btn"
              onClick={() => testAddTime(((25 / (settings.merch_price_threshold || 10)) * (settings.merch_base_reward_minutes || 5)) * 60, '🛒 TestUser bought Cool Shirt ($25)!')}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              🛒 Simulate
            </button>
          </div>

          <div className="setting-row">
            <span className="setting-label">$75 Merch Purchase</span>
            <button 
              className="test-btn"
              onClick={() => testAddTime(((75 / (settings.merch_price_threshold || 10)) * (settings.merch_base_reward_minutes || 5) + (settings.merch_bonus_50_minutes || 10)) * 60, '🛒 BigFan bought Hoodie Bundle ($75)!')}
              disabled={simulationLoading}
              style={{ padding: '8px 16px' }}
            >
              🛒 Simulate
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="settings-section">
          <h3 className="section-title">⚡ Quick Presets</h3>
          
          <div className="setting-row">
            <button 
              className="test-btn"
              onClick={() => {
                setSettings({
                  ...settings,
                  tier1_sub_time: 300,   // 5 min
                  tier2_sub_time: 600,   // 10 min
                  tier3_sub_time: 1200,  // 20 min
                  tier1_gift_time: 300,
                  tier2_gift_time: 600,
                  tier3_gift_time: 1200,
                  tier1_resub_time: 180, // 3 min
                  tier2_resub_time: 360, // 6 min
                  tier3_resub_time: 720, // 12 min
                });
              }}
              style={{ width: '100%' }}
            >
              🎯 Standard Preset
            </button>
          </div>

          <div className="setting-row">
            <button 
              className="test-btn"
              onClick={() => {
                setSettings({
                  ...settings,
                  tier1_sub_time: 600,   // 10 min
                  tier2_sub_time: 900,   // 15 min
                  tier3_sub_time: 1800,  // 30 min
                  tier1_gift_time: 600,
                  tier2_gift_time: 900,
                  tier3_gift_time: 1800,
                  tier1_resub_time: 300, // 5 min
                  tier2_resub_time: 600, // 10 min
                  tier3_resub_time: 1200, // 20 min
                });
              }}
              style={{ width: '100%' }}
            >
              🔥 Generous Preset
            </button>
          </div>

          <div className="setting-row">
            <button 
              className="test-btn"
              onClick={() => {
                setSettings({
                  ...settings,
                  tier1_sub_time: 120,   // 2 min
                  tier2_sub_time: 300,   // 5 min
                  tier3_sub_time: 600,   // 10 min
                  tier1_gift_time: 120,
                  tier2_gift_time: 300,
                  tier3_gift_time: 600,
                  tier1_resub_time: 60,  // 1 min
                  tier2_resub_time: 180, // 3 min
                  tier3_resub_time: 300, // 5 min
                });
              }}
              style={{ width: '100%' }}
            >
              ⚡ Conservative Preset
            </button>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button 
          className="save-btn" 
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
        
        <button 
          className="reset-btn" 
          onClick={fetchSettings}
        >
          🔄 Reset Changes
        </button>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(40, 40, 50, 0.5)', borderRadius: '10px' }}>
        <h3>📋 Current Timer Status</h3>
        <p style={{ margin: '10px 0', opacity: 0.8 }}>
          Visit your timer pages to see them in action:
        </p>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a href="/subathon-timer" target="_blank" style={{ 
            color: '#7877c6', 
            textDecoration: 'none', 
            padding: '8px 15px', 
            background: 'rgba(120, 119, 198, 0.2)', 
            borderRadius: '6px' 
          }}>
            🎮 Full Control Panel
          </a>
          <a href="/subathon-display" target="_blank" style={{ 
            color: '#7877c6', 
            textDecoration: 'none', 
            padding: '8px 15px', 
            background: 'rgba(120, 119, 198, 0.2)', 
            borderRadius: '6px' 
          }}>
            📺 OBS Display
          </a>
          <a href="/timer-minimal" target="_blank" style={{ 
            color: '#7877c6', 
            textDecoration: 'none', 
            padding: '8px 15px', 
            background: 'rgba(120, 119, 198, 0.2)', 
            borderRadius: '6px' 
          }}>
            ⚡ Minimal Display
          </a>
        </div>
      </div>
    </div>
  );
}
