import { db } from './schema';
import { v4 as uuidv4 } from 'uuid';

export class AuditRepository {
  static logAction(params: {
    userId?: string;
    username?: string;
    action: string;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      const id = `aud_${uuidv4()}`;
      const metaStr = params.metadata ? JSON.stringify(params.metadata) : null;
      db.prepare(`
        INSERT INTO admin_audit_logs (id, user_id, username, action, entity_type, entity_id, ip_address, user_agent, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        params.userId || null,
        params.username || 'system',
        params.action,
        params.entityType,
        params.entityId || null,
        params.ipAddress || '127.0.0.1',
        params.userAgent || 'system',
        metaStr
      );
    } catch (err) {
      console.error('[Audit Log Error]:', err);
    }
  }

  static logSecurityEvent(params: {
    eventType: string;
    ipAddress?: string;
    userAgent?: string;
    details?: string;
    severity?: 'info' | 'warning' | 'critical';
  }) {
    try {
      const id = `sec_${uuidv4()}`;
      db.prepare(`
        INSERT INTO security_events (id, event_type, ip_address, user_agent, details, severity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        params.eventType,
        params.ipAddress || '127.0.0.1',
        params.userAgent || 'system',
        params.details || '',
        params.severity || 'info'
      );
    } catch (err) {
      console.error('[Security Event Log Error]:', err);
    }
  }

  static getRecentAuditLogs(limit: number = 50) {
    return db.prepare(`
      SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }

  static getRecentSecurityEvents(limit: number = 50) {
    return db.prepare(`
      SELECT * FROM security_events ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }
}
