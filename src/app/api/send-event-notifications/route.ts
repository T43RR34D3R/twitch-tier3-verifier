import { NextResponse } from 'next/server';
import { queryRows, queryRow } from '../../../lib/railway-db';
import { sendSMS } from '../../../lib/twilio';
import { format } from 'date-fns';

// This API route will be called by a cron job to send notifications for events starting now
export async function POST() {
  try {
    // Get the current date and time
    const now = new Date();
    const currentDate = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');

    console.log(`🔔 Checking for events to notify at ${currentDate} ${currentTime}`);

    // Find events that should trigger notifications now
    // For all-day events: send at 9:00 AM on the event date
    // For timed events: send exactly when they start
    const eventsToNotify = await queryRows(`
      SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.date,
        ce.start_time,
        ce.end_time,
        ce.is_all_day,
        ce.sms_enabled,
        ce.sms_sent
      FROM calendar_events ce
      WHERE ce.sms_enabled = true
        AND ce.sms_sent = false
        AND ce.date = $1
        AND (
          -- All-day events: notify at 9:00 AM
          (ce.is_all_day = true AND $2 = '09:00')
          OR
          -- Timed events: notify exactly at start time
          (ce.is_all_day = false AND ce.start_time = $2)
        )
    `, [currentDate, currentTime]);

    console.log(`📋 Found ${eventsToNotify.length} events to notify about`);

    if (eventsToNotify.length === 0) {
      return NextResponse.json({ 
        message: 'No events to notify about at this time',
        notificationsSent: 0 
      });
    }

    // Get all users who have SMS enabled and verified
    const users = await queryRows(`
      SELECT user_id, phone_number
      FROM user_sms_preferences
      WHERE is_enabled = true AND verified = true AND phone_number IS NOT NULL
    `);

    console.log(`👥 Found ${users.length} users with SMS notifications enabled`);

    let notificationsSent = 0;
    const errors: string[] = [];

    // Send notifications for each event to each user
    for (const event of eventsToNotify) {
      for (const user of users) {
        try {
          // Create the notification message
          const message = createNotificationMessage(event);
          
          console.log(`📱 Sending SMS to ${user.phone_number} for event: ${event.title}`);
          
          // Send the SMS
          const smsResult = await sendSMS(user.phone_number, message);
          
          if (smsResult.success) {
            // Log the successful notification
            await queryRow(`
              INSERT INTO sms_notifications_log (
                event_id, user_id, phone_number, message, status, twilio_sid
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              event.id,
              user.user_id,
              user.phone_number,
              message,
              'sent',
              smsResult.sid
            ]);
            
            notificationsSent++;
            console.log(`✅ SMS sent successfully to ${user.phone_number} for event ${event.title}`);
          } else {
            // Log the failed notification
            await queryRow(`
              INSERT INTO sms_notifications_log (
                event_id, user_id, phone_number, message, status, error_message
              ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              event.id,
              user.user_id,
              user.phone_number,
              message,
              'failed',
              smsResult.error
            ]);
            
            errors.push(`Failed to send SMS to ${user.phone_number} for event ${event.title}: ${smsResult.error}`);
            console.error(`❌ Failed to send SMS to ${user.phone_number}: ${smsResult.error}`);
          }
        } catch (error: unknown) {
          console.error(`Error sending notification to ${user.user_id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error sending notification to ${user.user_id}: ${errorMessage}`);
        }
      }
      
      // Mark the event as having had SMS notifications sent
      await queryRow(`
        UPDATE calendar_events 
        SET sms_sent = true, sms_sent_at = NOW() 
        WHERE id = $1
      `, [event.id]);
      
      console.log(`📌 Marked event ${event.title} as SMS sent`);
    }

    const response = {
      message: `Processed ${eventsToNotify.length} events, sent ${notificationsSent} notifications`,
      eventsProcessed: eventsToNotify.length,
      notificationsSent,
      usersNotified: users.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`🎉 Notification job completed:`, response);
    
    return NextResponse.json(response);
    
  } catch (error: unknown) {
    console.error('Error in notification scheduler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function createNotificationMessage(event: {
  title: string;
  date: string;
  description?: string;
  is_all_day: boolean;
  start_time?: string;
  end_time?: string;
}): string {
  const eventDate = format(new Date(event.date), 'EEEE, MMMM do');
  
  if (event.is_all_day) {
    return `🗓️ Event Starting Today: ${event.title}\n📅 ${eventDate}\n${event.description ? `📝 ${event.description}` : ''}`.trim();
  } else {
    const timeStr = event.start_time;
    const endTimeStr = event.end_time && event.end_time !== event.start_time ? ` - ${event.end_time}` : '';
    
    return `🗓️ Event Starting Now: ${event.title}\n📅 ${eventDate}\n🕐 ${timeStr}${endTimeStr}\n${event.description ? `📝 ${event.description}` : ''}`.trim();
  }
}

// Manual trigger endpoint for testing (GET request)
export async function GET() {
  console.log('🧪 Manual notification trigger called');
  
  // Just call POST directly since we removed the request parameter
  return POST();
}
