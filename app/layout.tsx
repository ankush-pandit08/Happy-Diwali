import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Happy Diwali · A little light & laughter',description:'A personal Diwali voice wish and a golden scratch card with a funny Diwali joke, just for you.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
