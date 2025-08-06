import React, { useEffect, useState } from 'react';

export default function SubathonDisplay() {
    const [timeInSeconds, setTimeInSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [status, setStatus] = useState("Timer Ready");

    useEffect(() => {
        // Function to fetch timer state
        const fetchTimerState = async () => {
            try {
                const response = await fetch('/api/subathon-timer');
                const data = await response.json();
                setTimeInSeconds(data.timeInSeconds);
                setIsRunning(data.isRunning);
                setStatus(data.status);
            } catch (error) {
                console.error('Error fetching timer state:', error);
            }
        };

        // Initial fetch
        fetchTimerState();

        // Poll for updates every second
        const interval = setInterval(fetchTimerState, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'transparent', color: 'white' }}>
            <h1 style={{ fontFamily: 'Deadly', fontSize: '5rem', marginBottom: '20px' }}>Subathon Timer</h1>
            <div style={{ fontFamily: 'Deadly', fontSize: '8rem', fontWeight: 'bold' }}>
                {formatTime(timeInSeconds)}
            </div>
            <div style={{ fontSize: '2rem', marginTop: '10px', opacity: 0.8 }}>{status}</div>
        </div>
    );
}

