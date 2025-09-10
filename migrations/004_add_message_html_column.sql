-- Migration: Add message_html column to chat_highlights table
-- This column will store the HTML version of messages with emote images

ALTER TABLE chat_highlights 
ADD COLUMN message_html TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN chat_highlights.message_html IS 'HTML version of the message with emote images rendered as <img> tags';
