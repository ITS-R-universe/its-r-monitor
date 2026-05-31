import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: checks, error } = await supabaseAdmin
      .from('its_r_monitor_checks')
      .select('*')
      .order('checked_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const seen = new Set<string>()
    const latest: typeof checks = []
    for (const c of (checks || [])) {
      if (!seen.has(c.service_url)) { seen.add(c.service_url); latest.push(c) }
    }

    const summary = {
      total: latest.length,
      up: latest.filter(s => s.status === 'up').length,
      down: latest.filter(s => s.status === 'down').length,
      degraded: latest.filter(s => s.status === 'degraded').length,
      unknown: latest.filter(s => s.status === 'unknown').length,
      uptime_percent: latest.length > 0 ? Math.round((latest.filter(s => s.status === 'up').length / latest.length) * 1000) / 10 : 100,
    }

    const last_checked = checks?.[0]?.checked_at || null

    return NextResponse.json({ summary, services: latest, last_checked }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
