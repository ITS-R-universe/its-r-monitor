'use client'
import { useEffect, useState } from 'react'

export default function MonitorPage() {
  const [dark, setDark] = useState(true)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PER = 100

  const t = {
    bg: dark ? '#000000' : '#ffffff',
    card: dark ? '#111111' : '#f5f5f5',
    border: dark ? '#222222' : '#e0e0e0',
    text: dark ? '#ffffff' : '#000000',
    sub: dark ? '#888888' : '#555555',
    gold: '#d4af37',
  }

  async function loadAll() {
    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const all: any[] = []
    let offset = 0
    while(true) {
      const r = await fetch(`${SUPA_URL}/rest/v1/its_r_services?select=id,name,url,status,category&limit=1000&offset=${offset}&order=name.asc`, {
        headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
      })
      const d = await r.json()
      if(!Array.isArray(d) || d.length === 0) break
      all.push(...d)
      if(d.length < 1000) break
      offset += 1000
    }
    setServices(all)
  }

  async function runCheck() {
    setLoading(true)
    try { await fetch('/api/check'); await loadAll() } catch(e){}
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(runCheck, 60000)
    return () => clearInterval(interval)
  }, [])

  const counts: Record<string,number> = {}
  services.forEach(s => { counts[s.status] = (counts[s.status]||0)+1 })
  const filtered = services.filter(s => filter === 'all' || s.status === filter)
  const pages = Math.ceil(filtered.length / PER)
  const shown = filtered.slice(page*PER, (page+1)*PER)
  const sc: Record<string,string> = { live:'#22c55e', down:'#ef4444', coming_soon:'#f59e0b', planned:'#6366f1', pending:'#888888' }

  return (
    <div style={{minHeight:'100vh',background:t.bg,color:t.text,transition:'all 0.2s',fontFamily:'system-ui,sans-serif'}}>
      <div style={{maxWidth:'1400px',margin:'0 auto',padding:'2rem'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem',borderBottom:`1px solid ${t.border}`,paddingBottom:'1rem'}}>
          <div>
            <h1 style={{fontSize:'1.75rem',fontWeight:'bold',margin:0}}>
              <span style={{color:t.gold}}>ITS-R</span> Monitor
            </h1>
            <p style={{color:t.sub,fontSize:'0.8rem',margin:'0.25rem 0 0'}}>
              {services.length || 2213} services • Real-time
            </p>
          </div>
          <button onClick={() => setDark(!dark)} style={{background:t.card,border:`1px solid ${t.border}`,color:t.text,padding:'0.5rem 1rem',borderRadius:'0.5rem',cursor:'pointer',fontSize:'0.875rem'}}>
            {dark ? '☀️ Day' : '🌙 Night'}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
          {[['Total',services.length,'#d4af37'],['Live',counts.live||0,'#22c55e'],['Down',counts.down||0,'#ef4444'],['Soon',counts.coming_soon||0,'#f59e0b'],['Planned',counts.planned||0,'#6366f1']].map(([k,v,c])=>(
            <div key={k as string} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:'0.5rem',padding:'0.875rem',textAlign:'center'}}>
              <div style={{fontSize:'1.5rem',fontWeight:'bold',color:c as string}}>{v as number}</div>
              <div style={{color:t.sub,fontSize:'0.7rem',marginTop:'0.25rem'}}>{k as string}</div>
            </div>
          ))}
          <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:'0.5rem',padding:'0.875rem',textAlign:'center'}}>
            <button onClick={runCheck} disabled={loading} style={{background:loading?t.border:t.gold,color:loading?t.sub:'#000',border:'none',padding:'0.4rem 0.75rem',borderRadius:'0.375rem',cursor:loading?'not-allowed':'pointer',fontWeight:'bold',fontSize:'0.75rem',width:'100%'}}>
              {loading?'⏳':'🔍 Check'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'1rem'}}>
          {['all','live','down','coming_soon','planned'].map(f=>(
            <button key={f} onClick={()=>{setFilter(f);setPage(0)}} style={{background:filter===f?t.gold:t.card,color:filter===f?'#000':t.text,border:`1px solid ${t.border}`,padding:'0.375rem 0.75rem',borderRadius:'0.375rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:filter===f?'bold':'normal'}}>
              {f==='all'?`All (${services.length})`:f==='coming_soon'?`Soon (${counts.coming_soon||0})`:`${f.charAt(0).toUpperCase()+f.slice(1)} (${counts[f]||0})`}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.5rem',marginBottom:'1rem'}}>
          {shown.map(s=>(
            <div key={s.id} style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:'0.5rem',padding:'0.625rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <span style={{width:'8px',height:'8px',borderRadius:'50%',background:sc[s.status]||'#888',flexShrink:0,display:'inline-block'}}/>
              <div style={{overflow:'hidden'}}>
                <div style={{fontSize:'0.75rem',fontWeight:'500',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div>
                <div style={{fontSize:'0.65rem',color:sc[s.status]||t.sub}}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{display:'flex',justifyContent:'center',gap:'0.5rem',flexWrap:'wrap'}}>
            {Array.from({length:Math.min(pages,10)},(_,i)=>(
              <button key={i} onClick={()=>setPage(i)} style={{background:page===i?t.gold:t.card,color:page===i?'#000':t.text,border:`1px solid ${t.border}`,width:'2rem',height:'2rem',borderRadius:'0.375rem',cursor:'pointer',fontSize:'0.8rem',fontWeight:page===i?'bold':'normal'}}>
                {i+1}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign:'center',marginTop:'2rem',paddingTop:'1rem',borderTop:`1px solid ${t.border}`,color:t.sub,fontSize:'0.75rem'}}>
          ITS-R Universe • In loving memory of Roshan Ali Sahab 🤲
        </div>
      </div>
    </div>
  )
}
