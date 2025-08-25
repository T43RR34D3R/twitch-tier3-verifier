import { NextRequest, NextResponse } from 'next/server';
import { queryRow } from '@/lib/railway-db';

type TimerState = {
  id: number;
  end_time: number;
  is_running: boolean;
  status: string;
  pending_duration?: number;
  updated_at: string;
};

async function getTimerState(): Promise<TimerState> {
  try {
    // First try to get existing timer state
    const timer = await queryRow(
      'SELECT * FROM subathon_timer ORDER BY id LIMIT 1'
    );

    if (!timer) {
      // Create initial timer state if none exists
      const initialState = {
        end_time: 0,
        is_running: false,
        status: 'Timer Ready - Set time to begin!',
        pending_duration: 0
      };
      
      const newTimer = await queryRow(
        'INSERT INTO subathon_timer (end_time, is_running, status, pending_duration) VALUES ($1, $2, $3, $4) RETURNING *',
        [initialState.end_time, initialState.is_running, initialState.status, initialState.pending_duration]
      );
      
      if (!newTimer) {
        // Return fallback state if insert fails
        return {
          id: 1,
          end_time: 0,
          is_running: false,
          status: 'Timer Ready - Set time to begin!',
          pending_duration: 0,
          updated_at: new Date().toISOString()
        };
      }
      
      return newTimer;
    }

    return timer;
  } catch (error) {
    console.error('Error getting timer state:', error);
    throw error;
  }
}

async function updateTimerState(updates: Partial<TimerState>, id?: number): Promise<TimerState> {
  try {
    // Get current state to ensure we have the right ID
    const currentState = await getTimerState();
    const timerId = id || currentState.id;
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add timer ID for WHERE clause
    values.push(timerId);
    
    const updateQuery = `
      UPDATE subathon_timer 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;
    
    const updatedTimer = await queryRow(updateQuery, values);
    
    if (!updatedTimer) {
      throw new Error('Failed to update timer state');
    }
    
    return updatedTimer;
  } catch (error) {
    console.error('Failed to update timer state:', error);
    throw error;
  }
}

function getCurrentTimeRemaining(state: TimerState): number {
  if (!state.is_running || state.end_time <= 0) {
    return state.pending_duration || 0;
  }
  
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((state.end_time - now) / 1000));
  
  return remaining;
}

export async function GET() {
  try {
    const state = await getTimerState();
    let timeInSeconds = getCurrentTimeRemaining(state);
    
    // Auto-stop timer if it has finished
    if (state.is_running && timeInSeconds <= 0) {
      await updateTimerState({
        is_running: false,
        end_time: 0,
        status: '🎉 Timer Finished!',
        pending_duration: 0
      });
      timeInSeconds = 0;
    }
    
    return NextResponse.json({
      timeInSeconds,
      isRunning: state.is_running,
      status: state.status
    });
  } catch (error) {
    console.error('GET timer error:', error);
    return NextResponse.json({
      timeInSeconds: 0,
      isRunning: false,
      status: 'Error loading timer'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { action, time, customMessage } = requestData;
    console.log('POST request:', { action, time, customMessage });
    const now = Date.now();
    const currentState = await getTimerState();
    console.log('Current state:', currentState);
    
    let updates: Partial<TimerState> = {};
    
    switch (action) {
      case 'setTime':
        if (time && time > 0) {
          updates = {
            end_time: 0,
            is_running: false,
            status: `Timer set to ${Math.floor(time / 3600)}:${Math.floor((time % 3600) / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`,
            pending_duration: time
          };
        }
        break;
        
      case 'start':
        if (!currentState.is_running) {
          const duration = currentState.pending_duration || 0;
          if (duration > 0) {
            updates = {
              end_time: now + (duration * 1000),
              is_running: true,
              status: '⏳ Timer Running...',
              pending_duration: 0
            };
          }
        }
        break;
        
      case 'pause':
        if (currentState.is_running) {
          const remaining = getCurrentTimeRemaining(currentState);
          updates = {
            pending_duration: remaining,
            is_running: false,
            end_time: 0,
            status: '⏸️ Timer Paused'
          };
        }
        break;
        
      case 'addTime':
        if (currentState.is_running) {
          updates = {
            end_time: currentState.end_time + (300 * 1000),
            status: '➕ Added 5 minutes!'
          };
        } else {
          // Add to pending duration whether it exists or not
          const currentDuration = currentState.pending_duration || 0;
          updates = {
            pending_duration: currentDuration + 300,
            status: '➕ Added 5 minutes!'
          };
        }
        break;
        
      case 'removeTime':
        if (currentState.is_running) {
          updates = {
            end_time: Math.max(now, currentState.end_time - (300 * 1000)),
            status: '➖ Removed 5 minutes!'
          };
        } else {
          // Remove from pending duration 
          const currentDuration = currentState.pending_duration || 0;
          updates = {
            pending_duration: Math.max(0, currentDuration - 300),
            status: currentDuration > 0 ? '➖ Removed 5 minutes!' : 'Cannot remove time - timer at 00:00:00'
          };
        }
        break;
        
      case 'addCustomTime':
        if (time && time > 0) {
          if (currentState.is_running) {
            updates = {
              end_time: currentState.end_time + (time * 1000),
              status: customMessage || `➕ Added ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}!`
            };
          } else {
            const currentDuration = currentState.pending_duration || 0;
            updates = {
              pending_duration: currentDuration + time,
              status: customMessage || `➕ Added ${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}!`
            };
          }
        }
        break;
    }
    
    const updatedState = Object.keys(updates).length > 0 
      ? await updateTimerState(updates) 
      : currentState;
    
    const timeInSeconds = getCurrentTimeRemaining(updatedState);
    
    return NextResponse.json({
      timeInSeconds,
      isRunning: updatedState.is_running,
      status: updatedState.status
    });
  } catch (error) {
    console.error('POST timer error:', error);
    return NextResponse.json({ error: 'Failed to update timer' }, { status: 500 });
  }
}
