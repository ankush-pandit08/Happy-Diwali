import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Happy Diwali · A little light & luck',description:'A personal Diwali wish and a scratch card. Three lucky winners receive a gift card.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
