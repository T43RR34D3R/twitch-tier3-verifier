"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SMSPreferences {
  phone_number: string | null;
  is_enabled: boolean;
  country_code: string;
  verified: boolean;
}

interface SMSPreferencesProps {
  onClose: () => void;
}

export default function SMSPreferences({ onClose }: SMSPreferencesProps) {
  const { status } = useSession();
  const [preferences, setPreferences] = useState<SMSPreferences>({
    phone_number: '',
    is_enabled: false,
    country_code: '+1',
    verified: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    // Wait for session to load, then load preferences
    if (status === 'authenticated') {
      loadPreferences();
    } else if (status === 'unauthenticated') {
      setMessage({ type: 'error', text: 'Please log in to access SMS settings' });
      setLoading(false);
    }
  }, [status]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/sms-preferences', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setPreferences(data.preferences);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load preferences' });
      }
    } catch (error) {
      console.error('Error loading SMS preferences:', error);
      setMessage({ type: 'error', text: 'Error loading preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/sms-preferences', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();
      
      if (response.ok) {
        setPreferences(data.preferences);
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        
        if (data.phoneChanged) {
          setMessage({ 
            type: 'success', 
            text: 'Phone number updated! Please verify your new number to receive notifications.' 
          });
          setShowVerification(true);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Error saving preferences' });
    } finally {
      setSaving(false);
    }
  };

  const sendVerificationCode = async () => {
    console.log('📱 [SMS Debug] Send verification button clicked');
    console.log('📱 [SMS Debug] Current preferences:', preferences);
    
    setSendingCode(true);
    setMessage(null);
    
    try {
      console.log('📱 [SMS Debug] Making request to /api/sms-preferences PUT');
      const response = await fetch('/api/sms-preferences', {
        method: 'PUT',
        credentials: 'include'
      });

      console.log('📱 [SMS Debug] Response status:', response.status);
      const data = await response.json();
      console.log('📱 [SMS Debug] Response data:', data);
      
      if (response.ok) {
        console.log('📱 [SMS Debug] Verification code sent successfully');
        setMessage({ type: 'success', text: 'Verification code sent to your phone!' });
        setShowVerification(true);
      } else {
        console.log('📱 [SMS Debug] Error sending verification:', data.error);
        setMessage({ type: 'error', text: data.error || 'Failed to send verification code' });
      }
    } catch (error) {
      console.error('📱 [SMS Debug] Exception sending verification code:', error);
      setMessage({ type: 'error', text: 'Error sending verification code' });
    } finally {
      setSendingCode(false);
    }
  };

  const verifyPhoneNumber = async () => {
    if (!verificationCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    setVerifying(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/sms-preferences', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode })
      });

      const data = await response.json();
      
      if (response.ok) {
        setPreferences(data.preferences);
        setMessage({ type: 'success', text: 'Phone number verified successfully!' });
        setShowVerification(false);
        setVerificationCode('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to verify phone number' });
      }
    } catch (error) {
      console.error('Error verifying phone number:', error);
      setMessage({ type: 'error', text: 'Error verifying phone number' });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white">Loading SMS settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">📱 SMS Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/20 border border-green-700/50 text-green-300'
              : 'bg-red-900/20 border border-red-700/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {/* Enable/Disable SMS */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.is_enabled}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  is_enabled: e.target.checked
                }))}
                className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Enable SMS notifications for calendar events</span>
            </label>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number *
            </label>
            <div className="flex space-x-2">
              <select
                value={preferences.country_code}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  country_code: e.target.value
                }))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+31">🇳🇱 +31</option>
                <option value="+46">🇸🇪 +46</option>
                <option value="+47">🇳🇴 +47</option>
                <option value="+45">🇩🇰 +45</option>
              </select>
              <input
                type="tel"
                value={preferences.phone_number || ''}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  phone_number: e.target.value
                }))}
                placeholder="(555) 123-4567"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Verification Status */}
            {preferences.phone_number && (
              <div className="mt-2">
                {preferences.verified ? (
                  <div className="flex items-center space-x-2 text-green-300 text-sm">
                    <span>✅ Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-yellow-300 text-sm">
                    <span>⚠️ Not verified</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification Section */}
          {preferences.phone_number && !preferences.verified && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="text-yellow-300 text-sm mb-2">
                📱 <strong>Verification Required:</strong> You must verify your phone number to receive SMS notifications.
              </div>
              
              {!showVerification ? (
                <button
                  onClick={sendVerificationCode}
                  disabled={sendingCode}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                >
                  {sendingCode ? 'Sending...' : 'Send Verification Code'}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={6}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={verifyPhoneNumber}
                      disabled={verifying}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                    <button
                      onClick={sendVerificationCode}
                      disabled={sendingCode}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                    >
                      {sendingCode ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Information */}
          <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <div className="text-blue-300 text-sm">
              ℹ️ <strong>How it works:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>You&apos;ll receive SMS notifications when events start</li>
                <li>All-day events notify at 9:00 AM</li>
                <li>Timed events notify exactly when they begin</li>
                <li>Only events with SMS enabled will send notifications</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
