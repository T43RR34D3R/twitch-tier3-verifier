import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type TimerState = {
  id: number;
  end_time: number;
  is_running: boolean;
  status: string;
  pending_duration?: number;
  updated_at: string;
};

async function getTimerState(): Promise<TimerState> {
  // First try to get existing timer state
  const { data, error } = await supabase
    .from('subathon_timer')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching timer state:', error);
  }

  if (!data) {
    // Create initial timer state if none exists
    const initialState = {
      end_time: 0,
      is_running: false,
      status: 'Timer Ready - Set time to begin!',
      pending_duration: 0
    };
    
    const { data: newData, error: insertError } = await supabase
      .from('subathon_timer')
      .insert([initialState])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating initial timer state:', insertError);
      // Return a fallback state with required fields
      return {
        id: 1,
        end_time: 0,
        is_running: false,
        status: 'Timer Ready - Set time to begin!',
        pending_duration: 0,
        updated_at: new Date().toISOString()
      };
    }
    
    return newData;
  }

  return data;
}

async function updateTimerState(updates: Partial<TimerState>, id?: number): Promise<TimerState> {
  // Use provided ID or default to 1 (since we only have one timer)
  const timerId = id || 1;
  
  const { data, error } = await supabase
    .from('subathon_timer')
    .update(updates)
    .eq('id', timerId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update timer state:', error);
    throw error;
  }

  return data;
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
    const { action, time } = await request.json();
    const now = Date.now();
    const currentState = await getTimerState();
    
    let updates: Partial<TimerState> = {};
    
    switch (action) {
      case 'setTime':
        updates = {
          end_time: 0,
          is_running: false,
          status: `Timer set to ${Math.floor(time / 3600)}:${Math.floor((time % 3600) / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`,
          pending_duration: time
        };
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
        } else if (currentState.pending_duration) {
          updates = {
            pending_duration: currentState.pending_duration + 300,
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
        } else if (currentState.pending_duration) {
          updates = {
            pending_duration: Math.max(0, currentState.pending_duration - 300),
            status: '➖ Removed 5 minutes!'
          };
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
