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

  const getGuildIcon = (guildId: string, iconHash: string | null) => {
    if (!iconHash) return 'https://cdn.discordapp.com/embed/avatars/0.png';
    const ext = iconHash.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.${ext}`;
  };

  return (
    <div className="flex bg-background min-h-screen font-sans overflow-hidden selection:bg-primary selection:text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />
        
        {/* 🔥 แก้ไขตรงนี้: เปลี่ยน z-20 เป็น z-[100] */}
        <div className="h-20 flex justify-between items-center px-8 shrink-0 z-[100] backdrop-blur-sm sticky top-0 border-b border-border/50">
           <div className="text-foreground font-bold text-xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Welcome back! 👋
           </div>
           <ProfileMenu />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight drop-shadow-sm">
                  เลือกเซิร์ฟเวอร์ <span className="text-primary">(Select Server)</span>
                </h1>
                <p className="text-secondary text-lg font-light">จัดการบอทและตั้งค่าต่างๆ สำหรับชุมชนของคุณ</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-64 bg-card rounded-3xl border border-border animate-pulse-soft"></div>
                    ))}
                </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
                {guilds.map((g, index) => (
                  <Link key={g.id} href={`/dashboard/${g.id}/announcements`} 
                      className={`
                          group relative flex flex-col items-center p-6 rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden
                          hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                          ${g.bot_in_guild 
                              ? 'bg-card border border-border hover:border-primary/50 hover:bg-card-hover' 
                              : 'bg-card/40 border border-border opacity-70 grayscale hover:grayscale-0 hover:opacity-100 hover:border-primary/50'
                          }
                          opacity-0 animate-fade-in-up
                      `}
                      style={{ animationDelay: `${index * 80 + 300}ms` }}
                  >
                    {/* Hover Glow Effect */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${g.bot_in_guild ? 'from-primary to-transparent' : 'from-yellow-500 to-transparent'}`} />

                    {/* Status Indicator */}
                    <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border transition-colors duration-300
                        ${g.bot_in_guild 
                            ? 'bg-primary/10 text-primary border-primary/20' 
                            : 'bg-secondary/10 text-secondary border-secondary/20'}
                    `}>
                        <span className={`w-2 h-2 rounded-full ${g.bot_in_guild ? 'bg-primary animate-pulse' : 'bg-secondary'}`}></span>
                        {g.bot_in_guild ? 'Online' : 'Offline'}
                    </div>

                    <div className="relative mb-5 mt-4 group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                        <img 
                            src={getGuildIcon(g.id, g.icon)} 
                            alt={g.name} 
                            className={`w-28 h-28 rounded-[2rem] object-cover shadow-2xl transition-all duration-500 
                                ${g.bot_in_guild ? 'shadow-primary/20' : 'grayscale group-hover:grayscale-[30%]'} 
                            `} 
                        />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-black/40 blur-lg rounded-full" />
                    </div>
                    
                    <div className="text-foreground font-bold text-lg text-center truncate w-full px-2 mb-2 z-10 group-hover:text-primary transition-colors">
                      {g.name}
                    </div>

                    <div className={`text-[11px] font-semibold px-4 py-2 rounded-xl mt-auto z-10 transition-all duration-300
                        ${g.bot_in_guild 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 group-hover:scale-105 active:scale-95' 
                            : 'bg-secondary/10 text-secondary border border-border group-hover:border-primary group-hover:text-primary'}
                    `}>
                      {g.bot_in_guild ? 'จัดการบอท (Manage)' : 'เชิญบอท (Invite Bot)'}
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