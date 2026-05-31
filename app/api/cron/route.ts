import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const CORE_SERVICES = [
  { name: 'ITS-R Portal', url: 'https://its-r-portal.vercel.app', category: 'Foundation' },
  { name: 'ITS-R Passport', url: 'https://its-r-passport.vercel.app', category: 'Foundation' },
  { name: 'ITS-R SSO', url: 'https://its-r-sso.vercel.app', category: 'Foundation' },
  { name: 'ITS-R Dashboard', url: 'https://its-r-dashboard.vercel.app', category: 'Foundation' },
  { name: 'ITS-R Monitor', url: 'https://its-r-monitor.vercel.app', category: 'Foundation' },
]

async function checkService(svc: { name: string; url: string; category: string }) {
  const start = Date.now()
  try {
    const res = await fetch(svc.url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'ITS-R-Monitor/1.0' }
    })
    const response_time_ms = Date.now() - start
    const status = res.status < 400 ? (response_time_ms > 5000 ? 'degraded' : 'up') : 'down'
    return { service_name: svc.name, service_url: svc.url, category: svc.category, status, response_time_ms, status_code: res.status }
  } catch {
    return { service_name: svc.name, service_url: svc.url, category: svc.category, status: 'down', response_time_ms: null, status_code: null }
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const cronKey = req.nextUrl.searchParams.get('cron_key')
    if (cronKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const { data: liveServices } = await supabaseAdmin.from('its_r_services').select('name, url, category').eq('status', 'live').not('url', 'is', null)

    const allServices = [
      ...CORE_SERVICES,
      ...(liveServices || []).filter((s: { url: string }) => s.url && !CORE_SERVICES.find(c => c.url === s.url)).map((s: { name: string; url: string; category: string }) => ({ name: s.name, url: s.url, category: s.category || 'Service' }))
    ]

    const results = await Promise.allSettled(allServices.map(checkService))
    const checks = results.map((r, i) => r.status === 'fulfilled' ? r.value : {
      service_name: allServices[i].name,
      service_url: allServices[i].url,
      category: allServices[i].category,
      status: 'unknown',
      response_time_ms: null,
      status_code: null,
    })

    const { error } = await supabaseAdmin.from('its_r_monitor_checks').insert(checks)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const summary = {
      total: checks.length,
      up: checks.filter(c => c.status === 'up').length,
      down: checks.filter(c => c.status === 'down').length,
      checked_at: new Date().toISOString()
    }

    return NextResponse.json({ success: true, summary })
  } catch {
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
