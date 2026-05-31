import type{Metadata}from'next'
import'./globals.css'
export const metadata:Metadata={title:'ITS-R Monitor',description:'ITS-R Universe — Real-time monitoring of 2,213 services'}
export default function RootLayout({children}:{children:React.ReactNode}){return(<html lang='en'><body style={{background:'#0a0a0f',color:'#f8fafc',margin:0,fontFamily:'system-ui,sans-serif'}}>{children}</body></html>)}