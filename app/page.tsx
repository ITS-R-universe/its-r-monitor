'use client'
import { useEffect, useState, useCallback } from 'react'

interface StatusData {
  summary: { total: number; up: number; down: number; degraded: number; unknown: number; uptime_percent: number }
  services: ServiceStatus[]
  last_checked: string
}

interface ServiceStatus {
  id: string
  service_name: string
  service_url: string
  status: 'up' | 'down' | 'degraded' | 'unknown'
  response_time_ms: number | null
  status_code: number | null
  checked_at: string
  category: string
}

const STATUS_CONFIG = {
  up: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', label: 'Operational', dot: '#34d399' },
  down: { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Down', dot: '#f87171' },
  degraded: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', label: 'Degraded', dot: '#fbbf24' },
  unknown: { color: '#94a3b8', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)', label: 'Unknown', dot: '#64748b' },
}

export default function Monitor() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [nextRefresh, setNextRefresh] = useState(60)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      if (res.ok) { setData(await res.json()); setLastRefresh(new Date()) }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    const countdown = setInterval(() => setNextRefresh(n => n <= 1 ? 60 : n - 1), 1000)
    return () => { clearInterval(interval); clearInterval(countdown) }
  }, [load])

  const allUp = data?.summary.uptime_percent === 100
  const allDown = data && data.summary.down === data.summary.total

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <header style={{ borderBottom: '1px solid #1e293b', background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>👁️</span>
            <span style={{ color: '#d4af37', fontWeight: 800, fontSize: 18 }}>ITS-R Monitor</span>
          </div>
          <div style={{ color: '#475569', fontSize: 12 }}>Refresh in {nextRefresh}s</div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Overall Status Banner */}
        {!loading && data && (
          <div style={{ background: allUp ? 'rgba(52,211,153,0.08)' : allDown ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)', border: `1px solid ${allUp ? 'rgba(52,211,153,0.2)' : allDown ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`, borderRadius: 16, padding: '24px 28px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: allUp ? '#34d399' : allDown ? '#f87171' : '#fbbf24', boxShadow: `0 0 12px ${allUp ? '#34d399' : allDown ? '#f87171' : '#fbbf24'}` }} />
              <div>
                <div style={{ color: allUp ? '#34d399' : allDown ? '#f87171' : '#fbbf24', fontWeight: 700, fontSize: 20 }}>
                  {allUp ? 'All Systems Operational' : allDown ? 'Major Outage' : 'Partial Outage'}
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: allUp ? '#34d399' : '#fbbf24' }}>{data.summary.uptime_percent.toFixed(1)}%</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>Uptime</div>
            </div>
          </div>
        )}

        {/* Stats */}
        {!loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Total Monitored', val: data.summary.total, color: '#e2e8f0' },
              { label: 'Operational', val: data.summary.up, color: '#34d399' },
              { label: 'Down', val: data.summary.down, color: '#f87171' },
              { label: 'Unknown', val: data.summary.unknown, color: '#94a3b8' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Services List */}
        <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>Service Status</h2>
            <button onClick={load} style={{ padding: '7px 16px', background: 'transparent', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ padding: '18px 24px', borderBottom: '1px solid rgba(30,41,59,0.5)', background: 'rgba(30,41,59,0.1)', height: 60 }} />
            ))
          ) : data && data.services.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <p>No services monitored yet. Waiting for first cron run...</p>
            </div>
          ) : (
            data?.services.map(svc => {
              const cfg = STATUS_CONFIG[svc.status]
              return (
                <div key={svc.id} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(30,41,59,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.dot, flexShrink: 0, boxShadow: svc.status === 'up' ? `0 0 6px ${cfg.dot}` : 'none' }} />
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 15 }}>{svc.service_name}</div>
                      <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{svc.category}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {svc.response_time_ms !== null && (
                      <span style={{ color: svc.response_time_ms < 500 ? '#34d399' : svc.response_time_ms < 2000 ? '#fbbf24' : '#f87171', fontSize: 13, fontFamily: 'monospace' }}>
                        {svc.response_time_ms}ms
                      </span>
                    )}
                    {svc.status_code && (
                      <span style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>{svc.status_code}</span>
                    )}
                    <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {data?.last_checked && (
          <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 20 }}>
            Last cron check: {new Date(data.last_checked).toLocaleString()}
          </p>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #1e293b', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: 14 }}>ITS-R Universe</p>
        <p style={{ color: '#334155', fontSize: 12, marginTop: 4 }}>In loving memory of Roshan Ali Sahab</p>
      </footer>
    </div>
  )
}
