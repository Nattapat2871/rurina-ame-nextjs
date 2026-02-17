"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ProfileMenu from '@/components/ProfileMenu';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

export default function Dashboard() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับปุ่ม Toggle
  const [showOtherGuilds, setShowOtherGuilds] = useState(false);
  
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

  // แยกกลุ่มเซิร์ฟเวอร์
  const adminGuilds = guilds.filter(g => g.is_admin);
  const otherGuilds = guilds.filter(g => !g.is_admin);

  return (
    <div className="flex bg-background min-h-screen font-sans overflow-hidden selection:bg-primary selection:text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0" />
        
        <div className="h-20 flex justify-between items-center px-8 shrink-0 z-[100] backdrop-blur-sm sticky top-0 border-b border-border/50">
           <div className="text-foreground font-bold text-xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Welcome back! 👋
           </div>
           <ProfileMenu />
        </div>

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
              <>
                {/* 🔥 เพิ่มใหม่: แสดงจำนวนเซิร์ฟเวอร์ทั้งหมดที่เข้าร่วม */}
                <div className="mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="inline-flex items-center gap-2 bg-card/40 px-4 py-0.1 rounded-xl border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                        <span className="text-secondary text-sm font-medium">คุณเข้าร่วมเซิร์ฟเวอร์ทั้งหมด</span>
                        <span className="text-primary font-bold text-lg">{guilds.length}</span>
                        <span className="text-secondary text-sm font-medium">เซิร์ฟเวอร์</span>
                    </div>
                </div>

                {/* --- ส่วนที่ 1: เซิร์ฟเวอร์ที่เป็นแอดมิน --- */}
                <div className="mb-4 flex items-center gap-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <h2 className="text-xl font-bold text-foreground">
                        เซิร์ฟเวอร์ที่คุณดูแล
                    </h2>
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md text-sm font-bold">
                        {adminGuilds.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12 border-b border-border/50 mb-12">
                  {adminGuilds.map((g, index) => (
                    <Link key={g.id} href={`/dashboard/${g.id}`} 
                        className={`
                            group relative flex flex-col items-center p-6 rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden
                            hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                            ${g.bot_in_guild 
                                ? 'bg-card border border-border hover:border-primary/50 hover:bg-card-hover' 
                                : 'bg-card/40 border border-border grayscale hover:grayscale-0 hover:bg-card hover:border-primary/30'
                            }
                            opacity-0 animate-fade-in-up
                        `}
                        style={{ animationDelay: `${index * 50 + 200}ms` }}
                    >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${g.bot_in_guild ? 'from-primary to-transparent' : 'from-gray-600 to-transparent'}`} />

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

                {/* --- ส่วนที่ 2: เซิร์ฟเวอร์อื่นๆ (Toggle) --- */}
                {otherGuilds.length > 0 && (
                    <div className="pb-20">
                        <div className="flex flex-col items-center justify-center mb-8">
                            <button 
                                onClick={() => setShowOtherGuilds(!showOtherGuilds)}
                                className="flex items-center gap-3 text-secondary hover:text-primary transition-all duration-300 text-sm font-medium px-6 py-3 rounded-full bg-card/50 hover:bg-card border border-border hover:border-primary/50 shadow-sm"
                            >
                                <span>{showOtherGuilds ? "ซ่อนเซิร์ฟเวอร์อื่นๆ" : "แสดงเซิร์ฟเวอร์อื่นๆ (ที่คุณไม่ได้เป็นแอดมิน)"}</span>
                                <span className="bg-secondary/20 px-2 py-0.5 rounded text-xs">{otherGuilds.length}</span>
                                {showOtherGuilds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* 🔥 แก้ไข CSS ตรงนี้: 
                           ใช้ style={{ maxHeight: ... }} เพื่อทำ Animation 
                           แต่เมื่อเปิดแล้วให้เป็นค่าสูงๆ เพื่อไม่ให้บังเนื้อหา 
                        */}
                        <div 
                            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-hidden transition-all duration-700 ease-in-out`}
                            style={{ 
                                maxHeight: showOtherGuilds ? `${otherGuilds.length * 400}px` : '0px',
                                opacity: showOtherGuilds ? 1 : 0 
                            }}
                        >
                            {otherGuilds.map((g) => (
                                <div key={g.id} className="relative flex flex-col items-center p-6 rounded-3xl bg-card/10 border border-border/30 grayscale opacity-60 cursor-not-allowed select-none hover:opacity-80 transition-opacity">
                                    
                                    <div className="absolute top-4 right-4 text-secondary/50">
                                        <Lock className="w-4 h-4" />
                                    </div>

                                    <div className="relative mb-5 mt-4">
                                        <img src={getGuildIcon(g.id, g.icon)} alt={g.name} className="w-24 h-24 rounded-[1.5rem] object-cover shadow-sm opacity-70" />
                                    </div>
                                    
                                    <div className="text-secondary font-bold text-lg text-center truncate w-full px-2 mb-2">
                                        {g.name}
                                    </div>

                                    <div className="text-[10px] text-red-400 bg-red-400/5 px-3 py-1.5 rounded-lg mt-auto border border-red-400/10">
                                        คุณไม่มีสิทธิ์แอดมิน
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}