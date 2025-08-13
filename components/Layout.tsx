import Link from 'next/link'
import { ReactNode } from 'react'
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav style={{ background:'#111827',color:'#fff',padding:'10px 16px' }}>
        <div className="container" style={{ display:'flex', gap:16 }}>
          <b>Recicleta</b>
          <Link href="/">Dashboard</Link>
          <Link href="/bikes">Bikes</Link>
          <Link href="/users">Users</Link>
          <Link href="/rentals">Rentals</Link>
          <Link href="/sales">Sales</Link>
        </div>
      </nav>
      <div className="container">{children}</div>
    </div>
  )
}
