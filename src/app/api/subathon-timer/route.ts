import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for the timer state (in production, use a database)
const timerState = {
  timeInSeconds: 0,
  isRunning: false,
  lastUpdated: Date.now(),
  status: "Timer Ready - Set time to begin!"
};

export async function GET() {
  // Calculate current time if timer is running
  if (timerState.isRunning) {
    const elapsed = Math.floor((Date.now() - timerState.lastUpdated) / 1000);
    timerState.timeInSeconds = Math.max(0, timerState.timeInSeconds - elapsed);
    timerState.lastUpdated = Date.now();
    
    if (timerState.timeInSeconds <= 0) {
      timerState.isRunning = false;
      timerState.status = "🎉 Timer Finished!";
    }
  }
  
  return NextResponse.json(timerState);
}

export async function POST(request: NextRequest) {
  const { action, time } = await request.json();
  
  switch (action) {
    case 'setTime':
      timerState.timeInSeconds = time;
      timerState.isRunning = false;
      timerState.lastUpdated = Date.now();
      timerState.status = `Timer set to ${Math.floor(time / 3600)}:${Math.floor((time % 3600) / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
      break;
      
    case 'start':
      if (timerState.timeInSeconds > 0 && !timerState.isRunning) {
        timerState.isRunning = true;
        timerState.lastUpdated = Date.now();
        timerState.status = "⏳ Timer Running...";
      }
      break;
      
    case 'pause':
      if (timerState.isRunning) {
        const elapsed = Math.floor((Date.now() - timerState.lastUpdated) / 1000);
        timerState.timeInSeconds = Math.max(0, timerState.timeInSeconds - elapsed);
        timerState.isRunning = false;
        timerState.lastUpdated = Date.now();
        timerState.status = "⏸️ Timer Paused";
      }
      break;
      
    case 'addTime':
      timerState.timeInSeconds += 300; // Add 5 minutes
      timerState.lastUpdated = Date.now();
      timerState.status = "➕ Added 5 minutes!";
      break;
      
    case 'removeTime':
      const oldTime = timerState.timeInSeconds;
      timerState.timeInSeconds = Math.max(0, timerState.timeInSeconds - 300);
      timerState.lastUpdated = Date.now();
      timerState.status = oldTime > 0 ? "➖ Removed 5 minutes!" : "Cannot remove time - timer at 00:00:00";
      break;
  }
  
  return NextResponse.json(timerState);
}
