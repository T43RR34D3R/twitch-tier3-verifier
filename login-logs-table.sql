-- =====================================================
-- LOGIN LOGS TABLE
-- =====================================================
-- Run this in Railway PostgreSQL console to add login logging

-- Create login_logs table
CREATE TABLE IF NOT EXISTS login_logs (
    id BIGSERIAL PRIMARY KEY,
    
    -- User information
    user_id TEXT NOT NULL,
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    email TEXT,
    
    -- Login details
    ip_address INET,
    user_agent TEXT,
    login_method VARCHAR(50) DEFAULT 'twitch',
    
    -- Session information
    session_token TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Authentication status
    is_successful BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    
    -- Timestamps
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_logs_is_successful ON login_logs(is_successful);

-- Add the login logs table to the existing database setup
SELECT 'Login logs table created successfully! 📝' AS status,
       'Table is ready for login tracking.' AS message;
