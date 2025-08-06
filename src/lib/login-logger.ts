import { query } from './railway-db';
import { NextRequest } from 'next/server';

interface LoginLogData {
  user_id: string;
  username: string;
  display_name?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  login_method?: string;
  session_token?: string;
  access_token_expires_at?: Date;
  is_successful?: boolean;
  failure_reason?: string;
}

/**
 * Log a successful login
 */
export async function logSuccessfulLogin(
  userData: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  },
  request?: NextRequest,
  sessionToken?: string,
  accessTokenExpiresAt?: number
) {
  try {
    const logData: LoginLogData = {
      user_id: userData.id,
      username: userData.name || 'Unknown',
      display_name: userData.name || undefined,
      email: userData.email || undefined,
      ip_address: getClientIP(request),
      user_agent: request?.headers.get('user-agent') || undefined,
      login_method: 'twitch',
      session_token: sessionToken,
      access_token_expires_at: accessTokenExpiresAt ? new Date(accessTokenExpiresAt) : undefined,
      is_successful: true
    };

    await insertLoginLog(logData);
  } catch (error) {
    console.error('Failed to log successful login:', error);
    // Don't throw - logging shouldn't break the login flow
  }
}

/**
 * Log a failed login attempt
 */
export async function logFailedLogin(
  userId: string,
  username: string,
  reason: string,
  request?: NextRequest
) {
  try {
    const logData: LoginLogData = {
      user_id: userId,
      username,
      ip_address: getClientIP(request),
      user_agent: request?.headers.get('user-agent') || undefined,
      login_method: 'twitch',
      is_successful: false,
      failure_reason: reason
    };

    await insertLoginLog(logData);
  } catch (error) {
    console.error('Failed to log failed login:', error);
    // Don't throw - logging shouldn't break the flow
  }
}

/**
 * Insert a login log entry into the database
 */
async function insertLoginLog(logData: LoginLogData) {
  const sql = `
    INSERT INTO login_logs (
      user_id, username, display_name, email, ip_address, user_agent,
      login_method, session_token, access_token_expires_at,
      is_successful, failure_reason, login_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
    )
  `;

  const values = [
    logData.user_id,
    logData.username,
    logData.display_name,
    logData.email,
    logData.ip_address,
    logData.user_agent,
    logData.login_method || 'twitch',
    logData.session_token,
    logData.access_token_expires_at,
    logData.is_successful ?? true,
    logData.failure_reason
  ];

  await query(sql, values);
}

/**
 * Get client IP address from request
 */
function getClientIP(request?: NextRequest): string | undefined {
  if (!request) return undefined;

  // Try various headers that might contain the real IP
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const xClientIp = request.headers.get('x-client-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (cfConnectingIp) return cfConnectingIp;
  if (xRealIp) return xRealIp;
  if (xClientIp) return xClientIp;
  
  // NextRequest doesn't have a direct IP property in production
  // Return undefined as fallback since we've tried all headers
  return undefined;
}

/**
 * Get recent login logs (for admin dashboard)
 */
export async function getRecentLoginLogs(limit: number = 100) {
  const sql = `
    SELECT 
      id, user_id, username, display_name, email,
      ip_address, user_agent, login_method,
      is_successful, failure_reason, login_at
    FROM login_logs 
    ORDER BY login_at DESC 
    LIMIT $1
  `;

  const result = await query(sql, [limit]);
  return result.rows;
}

/**
 * Get login logs for a specific user
 */
export async function getUserLoginLogs(userId: string, limit: number = 50) {
  const sql = `
    SELECT 
      id, user_id, username, display_name, email,
      ip_address, user_agent, login_method,
      is_successful, failure_reason, login_at
    FROM login_logs 
    WHERE user_id = $1
    ORDER BY login_at DESC 
    LIMIT $2
  `;

  const result = await query(sql, [userId, limit]);
  return result.rows;
}

/**
 * Get login statistics
 */
export async function getLoginStats() {
  const sql = `
    SELECT 
      COUNT(*) as total_logins,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(CASE WHEN is_successful = true THEN 1 END) as successful_logins,
      COUNT(CASE WHEN is_successful = false THEN 1 END) as failed_logins,
      COUNT(CASE WHEN login_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as logins_24h,
      COUNT(CASE WHEN login_at >= NOW() - INTERVAL '7 days' THEN 1 END) as logins_7d,
      COUNT(CASE WHEN login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as logins_30d
    FROM login_logs
  `;

  const result = await query(sql);
  return result.rows[0];
}
