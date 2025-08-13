import Layout from '@/components/Layout'
import useSWR from 'swr'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())
export default function Home(){
  const { data: bikes } = useSWR('/api/bikes', fetcher)
  const { data: rentals } = useSWR('/api/rentals', fetcher)
  const { data: sales } = useSWR('/api/sales', fetcher)
  const active = (rentals||[]).filter((r:any)=>r.status==='Activo').length
  const available = (bikes||[]).filter((b:any)=>b.status==='Disponible').length
  const revenue = (rentals||[]).reduce((s:number,r:any)=>s+(r.fee||0),0) + (sales||[]).reduce((s:number,x:any)=>s+(x.total||0),0)
  return (
    <Layout>
      <div className="row">
        <div className="card" style={{flex:1}}><h3>Available Bikes</h3><div style={{fontSize:28,fontWeight:700}}>{available??'—'}</div></div>
        <div className="card" style={{flex:1}}><h3>Active Rentals</h3><div style={{fontSize:28,fontWeight:700}}>{active??'—'}</div></div>
        <div className="card" style={{flex:1}}><h3>Total Revenue (€)</h3><div style={{fontSize:28,fontWeight:700}}>{revenue??'—'}</div></div>
      </div>
    </Layout>
  )
}
