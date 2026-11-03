import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Light & Luck · Happy Diwali',description:'A little light. A heartfelt wish. A chance to shine. Join our office Diwali celebration.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
