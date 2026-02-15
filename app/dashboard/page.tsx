"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ProfileMenu from '@/components/ProfileMenu'; // 👈 1. นำเข้า ProfileMenu เข้ามาใช้งาน

export default function Dashboard() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
             window.location.href = '/'; 
             return [];
        }
        return res.json();
      })
      .then(data => {
        setGuilds(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load guilds", err);
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="flex bg-[#313338] min-h-screen font-sans overflow-hidden">
      <Sidebar />
      
      {/* 👇 2. ปรับพื้นที่ด้านขวาให้เป็นแนวตั้ง (flex-col) เพื่อแบ่งแถบบนกับเนื้อหา */}
      <div className="flex-1 flex flex-col h-screen">
        
        {/* 👇 3. แถบ Header ด้านบนสุด จัดให้อยู่ชิดขวา (justify-end) */}
        <div className="h-16 border-b border-[#1e1f22] flex justify-end items-center px-8 shrink-0 bg-[#313338]">
           <ProfileMenu />
        </div>

        {/* 👇 4. ส่วนเนื้อหาหลัก */}
        <div className="flex-1 p-10 overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-2">เลือกเซิร์ฟเวอร์</h1>
          <p className="text-[#949ba4] mb-8">จัดการเซิร์ฟเวอร์ของคุณได้ที่นี่ (บอทต้องอยู่ในเซิร์ฟเวอร์ก่อนนะ)</p>

          {loading ? (
              <div className="text-[#949ba4] animate-pulse">กำลังโหลดข้อมูล... 📡</div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {guilds.map((g) => (
                  <Link key={g.id} href={`/dashboard/${g.id}/announcements`} 
                      className={`
                          relative bg-[#2b2d31] p-5 rounded-xl border flex flex-col items-center transition duration-200 cursor-pointer group shadow-md
                          ${g.bot_in_guild 
                              ? 'border-[#23a559] hover:bg-[#232428] hover:-translate-y-1' 
                              : 'border-[#1e1f22] opacity-70 hover:opacity-100 hover:border-[#5865f2]'
                          }
                      `}>
                    
                    <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${g.bot_in_guild ? 'bg-[#23a559] shadow-[0_0_8px_#23a559]' : 'bg-[#80848e]'}`} 
                         title={g.bot_in_guild ? "บอทพร้อมใช้งาน ✅" : "บอทยังไม่เข้า ❌"}>
                    </div>

                    <img 
                      src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                      alt={g.name} 
                      className={`w-20 h-20 rounded-full mb-4 border-4 object-cover ${g.bot_in_guild ? 'border-[#23a559]' : 'border-[#1e1f22]'}`} 
                    />
                    
                    <div className="text-white font-bold text-center truncate w-full px-2">
                      {g.name}
                    </div>

                    <div className={`text-xs mt-2 px-3 py-1 rounded-full font-bold ${g.bot_in_guild ? 'bg-[#23a559]/20 text-[#23a559]' : 'bg-[#1e1f22] text-[#949ba4]'}`}>
                      {g.bot_in_guild ? 'พร้อมตั้งค่า ⚙️' : 'เชิญบอท +'}
                    </div>
                  </Link>
                ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}