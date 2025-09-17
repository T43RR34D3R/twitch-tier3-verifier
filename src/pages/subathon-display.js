import React, { useEffect, useState } from 'react';

export default function SubathonDisplay() {
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
                    font-family: 'Arial', sans-serif;
                    overflow: hidden;
                }

                .timer-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    padding: 20px;
                    background: transparent;
                }

                .timer-display {
                    background: rgba(10, 10, 15, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px 60px;
                    text-align: center;
                    box-shadow: 
                        0 25px 50px -12px rgba(0, 0, 0, 0.8),
                        0 0 0 1px rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    position: relative;
                }

                .timer-display::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(120, 119, 198, 0.1) 0%, transparent 100%);
                    border-radius: 20px;
                    pointer-events: none;
                }

                h1 {
                    font-family: 'Deadly', 'Arial Black', sans-serif;
                    font-size: 2.5rem;
                    margin-bottom: 30px;
                    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
                    position: relative;
                    z-index: 1;
                }

                .timer {
                    font-family: 'Deadly', monospace;
                    font-size: 6rem;
                    font-weight: 900;
                    margin: 20px 0;
                    background: linear-gradient(135deg, #ffffff 0%, #d0d0d0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                    letter-spacing: 0.1em;
                    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8));
                    position: relative;
                    z-index: 1;
                    transition: all 0.3s ease;
                }

                .timer.running {
                    animation: pulse 2s infinite;
                }

                .status {
                    font-size: 1.2rem;
                    color: #b0b0b0;
                    opacity: 0.8;
                    margin-top: 20px;
                    position: relative;
                    z-index: 1;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                /* Responsive for different OBS sizes */
                @media (max-width: 800px) {
                    .timer-display {
                        padding: 30px 40px;
                    }
                    
                    h1 {
                        font-size: 2rem;
                    }
                    
                    .timer {
                        font-size: 4rem;
                    }
                }

                @media (max-width: 500px) {
                    .timer-display {
                        padding: 20px 30px;
                    }
                    
                    h1 {
                        font-size: 1.5rem;
                    }
                    
                    .timer {
                        font-size: 3rem;
                    }
                    
                    .status {
                        font-size: 1rem;
                    }
                }
            `}</style>
            <div className="timer-container">
                <div className="timer-display">
                    <div className={`timer ${isRunning ? 'running' : ''}`}>
                        {formatTime(timeInSeconds)}
                    </div>
                </div>
            </div>
        </>
    );
}
