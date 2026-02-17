"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ProfileMenu from '@/components/ProfileMenu';

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
      
      <div className="flex-1 flex flex-col h-screen relative bg-[#313338]">
        
        {/* Header */}
        <div className="h-16 border-b border-[#1e1f22] flex justify-between items-center px-8 shrink-0 bg-[#313338] z-20">
           {/* เพิ่มอนิเมชั่น Fade In */}
           <div className="text-white font-bold text-lg opacity-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Welcome back! 👋
           </div>
           <ProfileMenu />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto">
            {/* เพิ่มอนิเมชั่น Slide Down */}
            <div className="opacity-0 animate-slide-down" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">เลือกเซิร์ฟเวอร์ (Select Server)</h1>
                <p className="text-[#949ba4] mb-8 text-lg">จัดการบอทและตั้งค่าต่างๆ สำหรับชุมชนของคุณ</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse-soft">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-48 bg-[#2b2d31] rounded-xl border border-[#1e1f22]"></div>
                    ))}
                </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                {guilds.map((g, index) => (
                  <Link key={g.id} href={`/dashboard/${g.id}/announcements`} 
                      className={`
                          relative bg-[#2b2d31] p-6 rounded-2xl border transition-all duration-300 cursor-pointer group shadow-lg flex flex-col items-center opacity-0 animate-scale-in
                          ${g.bot_in_guild 
                              ? 'border-[#1e1f22] hover:border-[#5865f2] hover:bg-[#35373c] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#5865f2]/10' 
                              : 'border-[#1e1f22] opacity-60 hover:opacity-90 hover:border-[#f0b232] grayscale hover:grayscale-0'
                          }
                      `}
                      // ใส่ Delay ให้การ์ดเด้งขึ้นมาทีละใบ
                      style={{ animationDelay: `${index * 50 + 300}ms` }}
                  >
                    
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-all duration-300 ${g.bot_in_guild ? 'bg-[#23a559] shadow-[0_0_10px_#23a559]' : 'bg-[#80848e]'}`} 
                         title={g.bot_in_guild ? "Online" : "Offline"}>
                    </div>

                    <div className="relative mb-4 group-hover:scale-110 transition-transform duration-300">
                        <img 
                            src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                            alt={g.name} 
                            className={`w-24 h-24 rounded-[2rem] object-cover shadow-md transition-all duration-300 ${g.bot_in_guild ? '' : 'brightness-50'}`} 
                        />
                    </div>
                    
                    <div className="text-white font-bold text-lg text-center truncate w-full px-2 mb-1 group-hover:text-[#5865f2] transition-colors">
                      {g.name}
                    </div>

                    <div className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full mt-2 transition-all duration-300 ${g.bot_in_guild ? 'bg-[#5865f2]/10 text-[#5865f2] group-hover:bg-[#5865f2] group-hover:text-white' : 'bg-[#1e1f22] text-[#949ba4] border border-[#3f4147]'}`}>
                      {g.bot_in_guild ? 'Manage Bot' : 'Invite Bot'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}