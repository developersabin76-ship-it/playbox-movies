import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  UserCheck,
  Database,
  Download,
  AlertTriangle,
  Activity,
  RefreshCw,
  Eye,
  Key,
  Server,
  FileCheck
} from 'lucide-react';

export const AdminSecuritySection: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem('lionel_auth_token') || '';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const [metricsRes, logsRes, eventsRes, usersRes] = await Promise.allSettled([
        fetch('/api/admin/metrics', { headers }).then((r) => r.json()),
        fetch('/api/admin/audit-logs?limit=25', { headers }).then((r) => r.json()),
        fetch('/api/admin/security-events?limit=25', { headers }).then((r) => r.json()),
        fetch('/api/admin/users', { headers }).then((r) => r.json())
      ]);

      if (metricsRes.status === 'fulfilled' && !metricsRes.value.error) {
        setMetrics(metricsRes.value);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.logs) {
        setAuditLogs(logsRes.value.logs);
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value.events) {
        setSecurityEvents(eventsRes.value.events);
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.users) {
        setUsers(usersRes.value.users);
      }
    } catch (err: any) {
      console.warn('Security data load error:', err);
      setErrorMsg('Failed to load live server security telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleExportBackup = () => {
    const token = localStorage.getItem('lionel_auth_token') || '';
    window.open(`/api/admin/backup/export?token=${token}`, '_blank');
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const token = localStorage.getItem('lionel_auth_token') || '';
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        alert(`User role updated to ${newRole}`);
        fetchSecurityData();
      } else {
        alert('Failed to update user role');
      }
    } catch (err) {
      alert('Error updating user role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-900/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Production Hardened
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Relational SQLite3 Engine (WAL Mode)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
            Database Architecture & Security Operations Center
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-time audit logging, intrusion detection, role-based access control (RBAC), and automated JSON/SQL database snapshot backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityData}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export DB Snapshot</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Database Movies
          </span>
          <p className="text-xl font-black text-white">{metrics?.moviesCount ?? 'Live'}</p>
          <span className="text-[10px] text-emerald-400 font-mono">
            {metrics?.moviesWithVideo ?? 0} with Active Video Links
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Registered Users
          </span>
          <p className="text-xl font-black text-white">{metrics?.usersCount ?? users.length ?? 1}</p>
          <span className="text-[10px] text-slate-400 font-mono">Bcrypt Hashed Passwords</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Security Events
          </span>
          <p className="text-xl font-black text-amber-400">{securityEvents.length}</p>
          <span className="text-[10px] text-slate-400 font-mono">Monitored & Logged</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-purple-400" /> Audit Logged Actions
          </span>
          <p className="text-xl font-black text-white">{auditLogs.length}</p>
          <span className="text-[10px] text-purple-300 font-mono">Immutable Log Trail</span>
        </div>
      </div>

      {/* Grid: Live Audit Trail & Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Admin Audit Log */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Immutable Admin Audit Trail</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Last 25 entries</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent administrative actions recorded.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600/30 text-blue-300 border border-blue-500/30">
                        {log.action}
                      </span>
                      <span className="text-slate-300 font-bold">{log.username || 'Admin'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Target: {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 12)}...)` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Intrusion & Rate Limit Events */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black text-white">Security & Auth Events Monitor</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Failed logins & rate limits</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
            {securityEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                All systems normal. No suspicious security events detected.
              </div>
            ) : (
              securityEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                    evt.severity === 'critical'
                      ? 'bg-red-950/40 border-red-800 text-red-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-400">
                        {evt.event_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">IP: {evt.ip_address}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{evt.details || 'Security event logged'}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* User Accounts & Role Permissions Table */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-black text-white">Role-Based Access Control (RBAC)</h3>
          </div>
          <span className="text-xs text-slate-400">Admin • Editor • Moderator • User</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-2.5">User</th>
                <th className="pb-2.5">Email</th>
                <th className="pb-2.5">Current Role</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Modify Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No users loaded yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-black text-xs">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : u.role === 'editor'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : u.role === 'moderator'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-blue-500 outline-none"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
