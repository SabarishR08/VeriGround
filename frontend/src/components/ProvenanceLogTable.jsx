import React, { useState, useEffect } from 'react';
import { Database, Filter, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle, XCircle, Clock } from 'lucide-react';
import { fetchProvenanceLog } from '../services/api';

export default function ProvenanceLogTable() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [verdictFilter, setVerdictFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async (filter = verdictFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProvenanceLog(filter || null);
      if (res.success) {
        setLogs(res.rows);
        setStats(res.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load provenance store');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(verdictFilter);
  }, [verdictFilter]);

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'Supported':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-success/10 text-success border border-success/20 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supported</span>
          </span>
        );
      case 'Partially Supported':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/40 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Partially Supported</span>
          </span>
        );
      case 'Unsupported':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Unsupported</span>
          </span>
        );
      case 'Contradicted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-950/80 text-rose-400 border border-rose-500/40 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Contradicted</span>
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">{verdict}</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-gray-900">Provenance Audit Store</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            SQLite-backed claim-to-source verification trail with full component score telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Verdicts</option>
              <option value="Supported" className="bg-slate-900">Supported</option>
              <option value="Partially Supported" className="bg-slate-900">Partially Supported</option>
              <option value="Unsupported" className="bg-slate-900">Unsupported</option>
              <option value="Contradicted" className="bg-slate-900">Contradicted</option>
            </select>
          </div>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Claims Logged</div>
            <div className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/10">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Supported</div>
            <div className="text-2xl font-semibold text-emerald-400 mt-1">{stats.by_verdict.Supported || 0}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-amber-900/40 bg-amber-950/10">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Partial</div>
            <div className="text-2xl font-semibold text-amber-400 mt-1">{stats.by_verdict['Partially Supported'] || 0}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unsupported</div>
            <div className="text-2xl font-semibold text-gray-700 mt-1">{stats.by_verdict.Unsupported || 0}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-rose-900/40 bg-rose-950/10">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Contradicted</div>
            <div className="text-2xl font-semibold text-rose-400 mt-1">{stats.by_verdict.Contradicted || 0}</div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span>Loading provenance audit records...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No provenance audit records found in SQLite store.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Claim Text</th>
                  <th className="p-3.5">Verdict</th>
                  <th className="p-3.5">Fused Score</th>
                  <th className="p-3.5">Source Doc ID</th>
                  <th className="p-3.5">Explanation</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((row) => (
                  <tr key={row.claim_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-medium text-gray-900 max-w-xs truncate" title={row.claim_text}>
                      {row.claim_text}
                    </td>
                    <td className="p-3.5 shrink-0">
                      {getVerdictBadge(row.verdict)}
                    </td>
                    <td className="p-3.5 font-mono text-cyan-400 font-bold">
                      {row.fused_score ? row.fused_score.toFixed(4) : '0.0000'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {row.source_document_id || 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-sm line-clamp-2" title={row.explanation}>
                      {row.explanation || <span className="text-slate-500 italic">No explanation generated</span>}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(row.timestamp).toLocaleTimeString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
