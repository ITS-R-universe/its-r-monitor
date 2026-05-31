'use client'
import { useEffect, useState } from 'react'
export default function MonitorPage() {
  const [data, setData] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const PER = 100

  async function loadAll() {
    const all: any[] = []
    let offset = 0
    while(true) {
      const r = await fetch(
        (process.env.NEXT_PUBLIC_SUPABASE_URL||'') + '/rest/v1/its_r_services?select=id,name,url,status,category&limit=1000&offset='+offset+'&order=name.asc',
        {headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'',Authorization:'Bearer '+(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'')}}
      )
      const d = await r.json()
      if(!Array.isArray(d)||d.length===0) break
      all.push(...d)
      if(d.length<1000) break
      offset+=1000
    }
    setServices(all)
  }

  async function runCheck() {
    setLoading(true)
    try { const r=await fetch('/api/check'); setData(await r.json()); await loadAll() } catch(e){}
    setLoading(false)
  }

  useEffect(()=>{ loadAll(); const t=setInterval(runCheck,60000); return()=>clearInterval(t) },[])

  const filtered=services.filter(s=>filter==='all'||s.status===filter)
  const pages=Math.ceil(filtered.length/PER)
  const shown=filtered.slice(page*PER,(page+1)*PER)
  const sc:Record<string,string>={live:'#22c55e',down:'#ef4444',coming_soon:'#f59e0b',planned:'#6366f1',pending:'#94a3b8'}
  const counts:Record<string,number>={}
  services.forEach(s=>{counts[s.status]=(counts[s.status]||0)+1})

  return(
    <div style={{maxWidth:'1400px',margin:'0 auto',padding:'2rem'}}>
      <div style={{textAlign:'center',marginBottom:'2rem'}}>
        <h1 style={{fontSize:'2rem',fontWeight:'bold'}}><span style={{color:'#d4af37'}}>ITS-R</span> Monitor</h1>
        <p style={{color:'#94a3b8',fontSize:'0.875rem'}}>Real-time status — All {services.length||2213} services</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
        {Object.entries({Total:services.length,Live:counts.live||0,Down:counts.down||0,'Coming Soon':counts.coming_soon||0,Planned:counts.planned||0}).map(([k,v])=>(
          <div key={k} style={{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'0.5rem',padding:'0.75rem',textAlign:'center'}}>
            <div style={{fontSize:'1.5rem',fontWeight:'bold',color:k==='Live'?'#22c55e':k==='Down'?'#ef4444':'#d4af37'}}>{v}</div>
            <div style={{color:'#94a3b8',fontSize:'0.7rem'}}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',marginBottom:'1rem'}}>
        <button onClick={runCheck} disabled={loading} style={{background:'#d4af37',color:'#0a0a0f',padding:'0.5rem 1.5rem',borderRadius:'0.5rem',border:'none',fontWeight:'bold',cursor:'pointer'}}>
          {loading?'⏳ Checking...':'🔍 Check Now'}
        </button>
        {data&&<p style={{color:'#94a3b8',fontSize:'0.75rem',marginTop:'0.5rem'}}>{data.checked} checked | {data.live} live | {data.down} down | {data.ms}ms</p>}
      </div>
      <div style={{display:'flex',gap:'0.375rem',flexWrap:'wrap',marginBottom:'1rem'}}>
        {['all','live','down','coming_soon','planned'].map(f=>(
          <button key={f} onClick={()=>{setFilter(f);setPage(0)}} style={{padding:'0.25rem 0.625rem',borderRadius:'0.25rem',border:'1px solid #1e293b',background:filter===f?'#d4af37':'#0d1117',color:filter===f?'#0a0a0f':'#94a3b8',cursor:'pointer',fontSize:'0.75rem'}}>
            {f.replace('_',' ')} ({f==='all'?services.length:counts[f]||0})
          </button>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'0.375rem',marginBottom:'1rem'}}>
        {shown.map(s=>(
          <div key={s.id} style={{background:'#0d1117',border:'1px solid #1e293b',borderRadius:'0.375rem',padding:'0.5rem',display:'flex',alignItems:'center',gap:'0.375rem'}}>
            <div style={{width:'7px',height:'7px',borderRadius:'50%',background:sc[s.status]||'#94a3b8',flexShrink:0}}/>
            <div style={{minWidth:0,flex:1}}>
              <div style={{color:'#f8fafc',fontSize:'0.75rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={s.name}>{s.name.replace('ITS-R-','')}</div>
              <div style={{color:'#64748b',fontSize:'0.65rem'}}>{s.category}</div>
            </div>
          </div>
        ))}
      </div>
      {pages>1&&<div style={{display:'flex',justifyContent:'center',gap:'0.5rem',alignItems:'center'}}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'0.375rem 0.75rem',background:'#0d1117',border:'1px solid #1e293b',color:'#f8fafc',borderRadius:'0.25rem',cursor:'pointer'}}>←</button>
        <span style={{color:'#94a3b8',fontSize:'0.8rem'}}>Page {page+1}/{pages} — {filtered.length} services</span>
        <button onClick={()=>setPage(p=>Math.min(pages-1,p+1))} disabled={page===pages-1} style={{padding:'0.375rem 0.75rem',background:'#0d1117',border:'1px solid #1e293b',color:'#f8fafc',borderRadius:'0.25rem',cursor:'pointer'}}>→</button>
      </div>}
      <div style={{textAlign:'center',marginTop:'2rem',color:'#64748b',fontSize:'0.7rem'}}>ITS-R Universe — In loving memory of Roshan Ali Sahab 🤲</div>
    </div>
  )
}