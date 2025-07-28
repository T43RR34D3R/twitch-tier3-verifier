"use client";

import { useState } from 'react';

export default function MinecraftChatTest() {
  const [playerName, setPlayerName] = useState('TestPlayer');
  const [playerUuid, setPlayerUuid] = useState('550e8400-e29b-41d4-a716-446655440000');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/minecraft/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          playerUuid,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setMessage('');
        console.log('Message sent successfully');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const sendTestMessages = async () => {
    const testMessages = [
      { name: 'Steve', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', msg: 'Hello everyone!' },
      { name: 'Alex', uuid: '853c80ef-3c37-49fd-aa49-938b674adae6', msg: 'Nice build!' },
      { name: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5', msg: 'Thanks for playing!' },
    ];

    for (const testMsg of testMessages) {
      await fetch('/api/minecraft/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: testMsg.name,
          playerUuid: testMsg.uuid,
          message: testMsg.msg,
        }),
      });
      
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat p-4" style={{backgroundImage: 'url(/buckfoozle-bg.png)'}}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-black mb-6">Minecraft Chat Test</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">Player UUID</label>
              <input
                type="text"
                value={playerUuid}
                onChange={(e) => setPlayerUuid(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black font-mono text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">Message</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Type your message..."
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={sendMessage}
                disabled={sending || !message.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              
              <button
                onClick={sendTestMessages}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Send Test Messages
              </button>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold text-black mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-black space-y-1">
              <li>Open the chat overlay in a new tab: <a href="/minecraft-chat" target="_blank" className="text-purple-600 underline">/minecraft-chat</a></li>
              <li>Use this page to test sending messages</li>
              <li>In OBS, add a Browser Source pointing to your chat overlay URL</li>
              <li>Set the width to 400px and height to 600px (or adjust as needed)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
