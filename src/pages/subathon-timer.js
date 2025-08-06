import React, { useEffect, useState } from 'react';

export default function SubathonTimer() {
    const [timeInSeconds, setTimeInSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [status, setStatus] = useState("Timer Ready");

    // Fetch timer state from API
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

    // Send action to API
    const sendAction = async (action, time = null) => {
        try {
            const response = await fetch('/api/subathon-timer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, time }),
            });
            const data = await response.json();
            setTimeInSeconds(data.timeInSeconds);
            setIsRunning(data.isRunning);
            setStatus(data.status);
        } catch (error) {
            console.error('Error sending action:', error);
        }
    };

    useEffect(() => {
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

    const setTime = () => {
        const time = prompt("Enter time in HH:MM:SS (e.g., 01:30:00 for 1 hour 30 minutes)");
        if (time && time.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            const parts = time.split(':');
            const totalSeconds = (+parts[0] * 3600) + (+parts[1] * 60) + (+parts[2]);
            sendAction('setTime', totalSeconds);
        } else if (time) {
            alert("Please enter time in HH:MM:SS format (e.g., 01:30:00)");
        }
    };

    const startTimer = () => sendAction('start');
    const pauseTimer = () => sendAction('pause');
    const addTime = () => sendAction('addTime');
    const removeTime = () => sendAction('removeTime');

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
                    margin: 0;
                    padding: 0;
                    font-family: 'Arial', sans-serif;
                    color: #e0e0e0;
                }

                .fullscreen-wrapper {
                    background-image: url('/buckfoozle-bg.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    padding: 1rem;
                }

                .fullscreen-wrapper::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 1;
                }

                .fullscreen-wrapper::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%);
                    z-index: 2;
                }

                .container {
                    background: rgba(10, 10, 15, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 
                        0 15px 30px rgba(0, 0, 0, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                    max-width: 500px;
                    width: 80%;
                    z-index: 10;
                }

                .container::before {
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
                    font-size: 3.5rem;
                    margin-bottom: 40px;
                    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
                }

                #timer {
                    font-family: 'Deadly', monospace;
                    font-size: 5rem;
                    font-weight: 900;
                    margin: 40px 0;
                    background: linear-gradient(135deg, #ffffff 0%, #d0d0d0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                    letter-spacing: 0.1em;
                    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8));
                    position: relative;
                }

                .controls {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: center;
                    margin-top: 40px;
                }

                .controls button {
                    background: linear-gradient(135deg, rgba(20, 20, 25, 0.8) 0%, rgba(40, 40, 50, 0.8) 100%);
                    border: 2px solid rgba(120, 119, 198, 0.3);
                    border-radius: 12px;
                    padding: 16px 28px;
                    color: #e0e0e0;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 
                        0 4px 15px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }

                .controls button::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(120, 119, 198, 0.2), transparent);
                    transition: left 0.5s;
                }

                .controls button:hover {
                    transform: translateY(-2px);
                    box-shadow: 
                        0 8px 25px rgba(0, 0, 0, 0.4),
                        0 0 20px rgba(120, 119, 198, 0.2);
                    border-color: rgba(120, 119, 198, 0.5);
                }

                .controls button:hover::before {
                    left: 100%;
                }

                .controls button:active {
                    transform: translateY(0);
                }

                .status {
                    margin-top: 30px;
                    font-size: 1.2rem;
                    opacity: 0.8;
                    color: #b0b0b0;
                }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                .running {
                    animation: pulse 2s infinite;
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 20px;
                    }
                    
                    h1 {
                        font-size: 2.5rem;
                    }
                    
                    #timer {
                        font-size: 2.5rem;
                    }
                    
                    .controls {
                        flex-direction: column;
                        align-items: center;
                    }
                    
                    .controls button {
                        width: 200px;
                    }
                }
            `}</style>
            <div className="fullscreen-wrapper">
                <div className="container">
                <h1>SUBATHON TIMER</h1>
                <div id="timer">{formatTime(timeInSeconds)}</div>
                <div className="status" id="status">{status}</div>
                <div className="controls">
                    <button onClick={setTime}>⏰ Set Time</button>
                    <button onClick={pauseTimer}>⏸️ Pause</button>
                    <button onClick={startTimer}>▶️ Start</button>
                    <button onClick={addTime}>➕ Add 5 Min</button>
                    <button onClick={removeTime}>➖ Remove 5 Min</button>
                </div>
            </div>
            </div>
        </>
    );
}
