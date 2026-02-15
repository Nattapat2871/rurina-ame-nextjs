"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function Dashboard() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
             window.location.href = '/'; // ถ้า Token หมดอายุ ให้เด้งไปหน้า Login
             return [];
        }
        return res.json();
      })
      .then(data => setGuilds(Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to load guilds", err));
  }, [API_URL]);

  return (
    <div className="flex bg-[#313338] min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 p-10">
        <h1 className="text-2xl font-bold text-white mb-2">เลือกเซิร์ฟเวอร์</h1>
        <p className="text-[#949ba4] mb-8">เลือกเซิร์ฟเวอร์ที่คุณต้องการตั้งค่า</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {guilds.map((g) => (
            <Link key={g.id} href={`/dashboard/${g.id}/announcements`} 
                className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22] flex flex-col items-center hover:-translate-y-1 hover:bg-[#5865f2] transition duration-200 cursor-pointer group shadow-md">
              <img 
                src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                alt={g.name} 
                className="w-20 h-20 rounded-full mb-4 border-4 border-[#1e1f22] group-hover:border-[#4752c4] object-cover" 
              />
              <div className="text-white font-bold text-center truncate w-full">{g.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}