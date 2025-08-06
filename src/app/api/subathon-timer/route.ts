import { NextRequest, NextResponse } from 'next/server';

// Timer state - stores the END TIME when running, not current seconds
const timerState: {
  endTime: number;
  isRunning: boolean;
  status: string;
  pendingDuration?: number;
} = {
  endTime: 0, // When the timer will finish (timestamp)
  isRunning: false,
  status: "Timer Ready - Set time to begin!"
};

function getCurrentTimeRemaining() {
  if (!timerState.isRunning || timerState.endTime <= 0) {
    // Return pending duration if timer is not running but has time set
    return timerState.pendingDuration || 0;
  }
  
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((timerState.endTime - now) / 1000));
  
  // Auto-stop when timer reaches zero
  if (remaining <= 0 && timerState.isRunning) {
    timerState.isRunning = false;
    timerState.endTime = 0;
    timerState.status = "🎉 Timer Finished!";
    delete timerState.pendingDuration;
    return 0;
  }
  
  return remaining;
}

export async function GET() {
  const timeInSeconds = getCurrentTimeRemaining();
  
  return NextResponse.json({
    timeInSeconds,
    isRunning: timerState.isRunning,
    status: timerState.status
  });
}

export async function POST(request: NextRequest) {
  const { action, time } = await request.json();
  const now = Date.now();
  
  switch (action) {
    case 'setTime':
      timerState.endTime = 0; // Reset
      timerState.isRunning = false;
      timerState.status = `Timer set to ${Math.floor(time / 3600)}:${Math.floor((time % 3600) / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
      // Store the duration temporarily for starting
      timerState.pendingDuration = time;
      break;
      
    case 'start':
      if (!timerState.isRunning) {
        const duration = timerState.pendingDuration || getCurrentTimeRemaining();
        if (duration > 0) {
          timerState.endTime = now + (duration * 1000);
          timerState.isRunning = true;
          timerState.status = "⏳ Timer Running...";
          delete timerState.pendingDuration;
        }
      }
      break;
      
    case 'pause':
      if (timerState.isRunning) {
        const remaining = getCurrentTimeRemaining();
        timerState.pendingDuration = remaining;
        timerState.isRunning = false;
        timerState.endTime = 0;
        timerState.status = "⏸️ Timer Paused";
      }
      break;
      
    case 'addTime':
      if (timerState.isRunning) {
        timerState.endTime += 300 * 1000; // Add 5 minutes in milliseconds
      } else if (timerState.pendingDuration) {
        timerState.pendingDuration += 300;
      }
      timerState.status = "➕ Added 5 minutes!";
      break;
      
    case 'removeTime':
      if (timerState.isRunning) {
        timerState.endTime = Math.max(now, timerState.endTime - (300 * 1000));
      } else if (timerState.pendingDuration) {
        timerState.pendingDuration = Math.max(0, timerState.pendingDuration - 300);
      }
      timerState.status = "➖ Removed 5 minutes!";
      break;
  }
  
  const timeInSeconds = getCurrentTimeRemaining();
  
  return NextResponse.json({
    timeInSeconds,
    isRunning: timerState.isRunning,
    status: timerState.status
  });
}
