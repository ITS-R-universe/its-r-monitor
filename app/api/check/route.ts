import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

async function getAllServices() {
  const all: any[] = []
  let offset = 0
  while (true) {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/its_r_services?select=id,name,url,status&limit=1000&offset=' + offset,
      { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } }
    )
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }
  return all
}

async function checkService(service: any) {
  if (!service.url) return { id: service.id, status: 'pending' }
  try {
    const ctrl = new AbortController()
    setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(service.url, { method: 'HEAD', signal: ctrl.signal, cache: 'no-store' })
    return { id: service.id, status: res.ok ? 'live' : 'down' }
  } catch {
    return { id: service.id, status: 'down' }
  }
}

export async function GET() {
  const started = Date.now()
  const services = await getAllServices()
  const toCheck = services.filter(s => s.url && s.status !== 'planned')
  const results: any[] = []
  for (let i = 0; i < toCheck.length; i += 50) {
    const batch = toCheck.slice(i, i + 50)
    const batchR = await Promise.all(batch.map(checkService))
    results.push(...batchR)
    await Promise.all(batchR.map(r =>
      fetch(SUPABASE_URL + '/rest/v1/its_r_services?id=eq.' + r.id, {
        method: 'PATCH',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status: r.status, last_checked: new Date().toISOString() })
      })
    ))
  }
  return NextResponse.json({
    total: services.length, checked: toCheck.length,
    live: results.filter(r=>r.status==='live').length,
    down: results.filter(r=>r.status==='down').length,
    ms: Date.now()-started, at: new Date().toISOString()
  })
}
export const revalidate = 0