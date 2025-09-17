import React, { useEffect, useState } from 'react';

export default function MinimalTimer() {
    const [timeInSeconds, setTimeInSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        // Fetch timer state from API
        const fetchTimerState = async () => {
            try {
                const response = await fetch('/api/subathon-timer');
                const data = await response.json();
                setTimeInSeconds(data.timeInSeconds);
                setIsRunning(data.isRunning);
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
        // Ensure seconds is a valid number
        const safeSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
        const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(Math.floor(safeSeconds % 60)).padStart(2, '0');
        return `${hours}:${minutes}:${secs}`;
    };

    return (
        <>
            <style jsx>{`
                @font-face {
                    font-family: 'Deadly';
                    src: url('/DEADLY.OTF') format('opentype');
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    background: transparent;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                }

                .timer-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: transparent;
                }

                .timer {
                    font-family: 'Deadly', monospace;
                    font-size: 8rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #ffffff 0%, #d0d0d0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                    letter-spacing: 0.1em;
                    filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.9));
                    transition: all 0.3s ease;
                }

                .timer.running {
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.8; }
                    100% { opacity: 1; }
                }

                /* Responsive for different OBS sizes */
                @media (max-width: 800px) {
                    .timer {
                        font-size: 6rem;
                    }
                }

                @media (max-width: 500px) {
                    .timer {
                        font-size: 4rem;
                    }
                }
            `}</style>
            <div className="timer-container">
                <div className={`timer ${isRunning ? 'running' : ''}`}>
                    {formatTime(timeInSeconds)}
                </div>
            </div>
        </>
    );
}
