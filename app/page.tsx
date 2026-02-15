"use client";
import Link from 'next/link';

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#313338] text-white p-4">
      <div className="bg-[#2b2d31] p-10 rounded-xl shadow-lg text-center max-w-md w-full border border-[#1e1f22]">
        <h1 className="text-3xl font-bold mb-4 text-[#dbdee1]">
          Rurina-Ame
        </h1>
        <p className="text-[#949ba4] mb-8">
          ระบบจัดการบอท Discord ผ่านหน้าเว็บ<br/>สะดวก รวดเร็ว และง่ายดาย
        </p>
        
        <Link 
          href={`${API_URL}/api/auth/login`}
          className="inline-block bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded transition duration-200 w-full"
        >
          Login with Discord
        </Link>
      </div>
    </main>
  );
}