import React, { useEffect } from 'react';

export default function SubathonTimer() {
    useEffect(() => {
        // Initialize timer on component mount
        let timerInterval;
        let timeInSeconds = 0;
        let isRunning = false;

        function displayTime() {
            const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(timeInSeconds % 60).padStart(2, '0');
            const timerElement = document.getElementById('timer');
            if (timerElement) {
                timerElement.innerText = hours + ':' + minutes + ':' + seconds;
                
                if (isRunning) {
                    timerElement.classList.add('running');
                } else {
                    timerElement.classList.remove('running');
                }
            }
        }

        function updateStatus(message) {
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.innerText = message;
            }
        }

        window.setTime = function() {
            const time = prompt("Enter time in HH:MM:SS (e.g., 01:30:00 for 1 hour 30 minutes)");
            if (time && time.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
                const parts = time.split(':');
                timeInSeconds = (+parts[0] * 3600) + (+parts[1] * 60) + (+parts[2]);
                displayTime();
                updateStatus('Timer set to ' + time);
            } else if (time) {
                alert("Please enter time in HH:MM:SS format (e.g., 01:30:00)");
            }
        };

        window.startTimer = function() {
            if (!isRunning && timeInSeconds > 0) {
                isRunning = true;
                updateStatus("⏳ Timer Running...");
                timerInterval = setInterval(() => {
                    timeInSeconds--;
                    if (timeInSeconds <= 0) {
                        timeInSeconds = 0;
                        window.pauseTimer();
                        updateStatus("🎉 Timer Finished!");
                        const timerElement = document.getElementById('timer');
                        if (timerElement) {
                            timerElement.style.animation = 'pulse 0.5s ease-in-out 3';
                            setTimeout(() => {
                                timerElement.style.animation = '';
                            }, 1500);
                        }
                    }
                    displayTime();
                }, 1000);
            } else if (timeInSeconds === 0) {
                updateStatus("Please set a time first!");
            }
        };

        window.pauseTimer = function() {
            if (isRunning) {
                isRunning = false;
                clearInterval(timerInterval);
                updateStatus("⏸️ Timer Paused");
                displayTime();
            }
        };

        window.addTime = function() {
            timeInSeconds += 300;
            displayTime();
            updateStatus("➕ Added 5 minutes!");
        };

        window.removeTime = function() {
            const oldTime = timeInSeconds;
            timeInSeconds = Math.max(0, timeInSeconds - 300);
            displayTime();
            if (oldTime > 0) {
                updateStatus("➖ Removed 5 minutes!");
            } else {
                updateStatus("Cannot remove time - timer at 00:00:00");
            }
        };

        displayTime();
        updateStatus("Timer Ready - Set time to begin!");

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, []);

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
                    font-family: 'Arial', sans-serif;
                    background-image: url('/buckfoozle-bg.png');
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #e0e0e0;
                    position: relative;
                    padding: 1rem;
                }

                body::before {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: -1;
                }

                body::after {
                    content: "";
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%);
                    z-index: -1;
                }

                .container {
                    background: rgba(10, 10, 15, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 50px;
                    box-shadow: 
                        0 25px 50px -12px rgba(0, 0, 0, 0.8),
                        0 0 0 1px rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(120, 119, 198, 0.2);
                    text-align: center;
                    max-width: 700px;
                    width: 100%;
                    max-width: 90vw;
                    position: relative;
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
            <div className="container">
                <h1>SUBATHON TIMER</h1>
                <div id="timer">00:00:00</div>
                <div className="status" id="status">Timer Stopped</div>
                <div className="controls">
                    <button onClick={() => window.setTime()}>⏰ Set Time</button>
                    <button onClick={() => window.pauseTimer()}>⏸️ Pause</button>
                    <button onClick={() => window.startTimer()}>▶️ Start</button>
                    <button onClick={() => window.addTime()}>➕ Add 5 Min</button>
                    <button onClick={() => window.removeTime()}>➖ Remove 5 Min</button>
                </div>
            </div>
        </>
    );
}
