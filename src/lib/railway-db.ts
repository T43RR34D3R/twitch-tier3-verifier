import { Pool } from 'pg';

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;

// Helper function for queries
export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper function for single row queries
export async function queryRow(text: string, params?: unknown[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

// Helper function for multiple row queries
export async function queryRows(text: string, params?: unknown[]) {
  const result = await query(text, params);
  return result.rows;
}

// Chat highlight interfaces
export interface ChatHighlight {
  id?: number;
  message_id: string;
  channel: string;
  username: string;
  display_name: string;
  message: string;
  timestamp: number;
  color: string;
  badges: string[];
  source: string;
  created_at?: string;
  updated_at?: string;
}

// Highlight database operations
export class HighlightsDB {
  // Get all highlights for a channel
  static async getChannelHighlights(channel: string, limit = 50): Promise<ChatHighlight[]> {
    const result = await query(`
      SELECT 
        id, message_id, channel, username, display_name, message, 
        timestamp, color, badges, source, created_at, updated_at
      FROM chat_highlights 
      WHERE channel = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `, [channel.toLowerCase(), limit]);
    
    return result.rows.map(row => ({
      ...row,
      badges: Array.isArray(row.badges) ? row.badges : []
    }));
  }

  // Check if a highlight exists
  static async highlightExists(messageId: string): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM chat_highlights WHERE message_id = $1',
      [messageId]
    );
    return result.rows.length > 0;
  }

  // Add a highlight (or toggle if it exists)
  static async toggleHighlight(highlight: Omit<ChatHighlight, 'id' | 'created_at' | 'updated_at'>): Promise<{ action: 'added' | 'removed', highlight?: ChatHighlight }> {
    // Check if highlight already exists
    const existsResult = await query(
      'SELECT id FROM chat_highlights WHERE message_id = $1',
      [highlight.message_id]
    );

    if (existsResult.rows.length > 0) {
      // Remove existing highlight
      await query(
        'DELETE FROM chat_highlights WHERE message_id = $1',
        [highlight.message_id]
      );
      return { action: 'removed' };
    } else {
      // Add new highlight
      const result = await query(`
        INSERT INTO chat_highlights (
          message_id, channel, username, display_name, message, 
          timestamp, color, badges, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        highlight.message_id,
        highlight.channel.toLowerCase(),
        highlight.username.toLowerCase(),
        highlight.display_name,
        highlight.message,
        highlight.timestamp,
        highlight.color,
        JSON.stringify(highlight.badges),
        highlight.source
      ]);

      const newHighlight = {
        ...result.rows[0],
        badges: Array.isArray(result.rows[0].badges) ? result.rows[0].badges : []
      };

      return { action: 'added', highlight: newHighlight };
    }
  }

  // Remove specific highlight
  static async removeHighlight(messageId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM chat_highlights WHERE message_id = $1',
      [messageId]
    );
    return (result.rowCount || 0) > 0;
  }

  // Clear all highlights for a channel
  static async clearChannelHighlights(channel: string): Promise<number> {
    const result = await query(
      'DELETE FROM chat_highlights WHERE channel = $1',
      [channel.toLowerCase()]
    );
    return result.rowCount || 0;
  }

  // Clean up old highlights (optional maintenance)
  static async cleanupOldHighlights(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await query(
      'DELETE FROM chat_highlights WHERE created_at < $1',
      [cutoffDate]
    );
    
    return result.rowCount || 0;
  }
}
