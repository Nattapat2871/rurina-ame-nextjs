"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProfileMenu from '@/components/ProfileMenu'; 
import { useParams } from 'next/navigation';
import { Menu, Bot, ShieldAlert, Sparkles } from 'lucide-react';
import { UnsavedChangesProvider } from '@/components/providers/UnsavedChangesContext';

// --- Sub Components ---
const LoadingView = () => (
    <div className="flex-1 p-10 animate-pulse">
        <div className="h-8 bg-card rounded w-1/4 mb-6"></div>
        <div className="bg-card rounded-lg p-6 border border-border h-40 mb-4"></div>
        <div className="bg-card rounded-lg p-6 border border-border h-20"></div>
        <div className="mt-4 text-secondary text-sm text-center animate-pulse">กำลังเชื่อมต่อกับเซิร์ฟเวอร์... 📡</div>
    </div>
);

const InviteView = ({ inviteUrl }: { inviteUrl: string }) => (
    <div className="flex-1 flex items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-card/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-border shadow-2xl shadow-primary/10 relative z-10 opacity-0 animate-fade-in-up">
            <div className="flex justify-center mb-6 relative">
                <div className="relative">
                    <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center border-2 border-border shadow-lg relative z-10">
                        <Bot className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full border-4 border-card z-20 animate-bounce">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold mb-3 text-foreground tracking-tight">
                บอทยังไม่อยู่ในเซิร์ฟเวอร์
            </h2>
            <p className="text-secondary mb-8 text-base md:text-lg font-light">
                ดูเหมือนว่า <span className="text-primary font-semibold">Rurina Ame</span> จะยังไม่ได้เข้าบ้านนี้นะ <br/>
                รบกวนเชิญน้องเข้าเซิร์ฟเวอร์ก่อนเริ่มตั้งค่าครับ
            </p>

            <a href={inviteUrl} target="_blank" className="group relative flex items-center justify-center gap-3 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 w-full shadow-lg hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>เชิญบอทเข้าเซิร์ฟเวอร์ (Invite Bot)</span>
            </a>

            <div className="mt-8 flex items-center justify-center gap-2 text-secondary text-xs font-mono bg-background/50 py-2 px-4 rounded-full border border-border w-fit mx-auto animate-pulse-soft">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                Waiting for connection...
            </div>
        </div>
    </div>
);

// --- Main Layout Component ---
export default function GuildLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const guildId = params.id as string;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    const [isBotInGuild, setIsBotInGuild] = useState<boolean | null>(null);
    const [inviteUrl, setInviteUrl] = useState("");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkBot = async () => {
            try {
                const res = await fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' });
                
                // 1. ถ้าไม่ได้ Login (401) -> ไปหน้าแรก
                if (res.status === 401) {
                    window.location.href = '/'; 
                    return;
                }

                // 2. ถ้าไม่ใช่ Admin (403) -> ไปหน้า Dashboard รวม
                if (res.status === 403) {
                    window.location.href = '/dashboard'; 
                    return;
                }

                if (!res.ok) return;
                
                const data = await res.json();
                if (data.in_guild) {
                    setIsBotInGuild(true);
                } else {
                    setIsBotInGuild(false);
                    setInviteUrl(data.invite_url);
                }
            } catch (e) {
                console.error("Check bot error:", e);
            }
        };

        checkBot();
        const interval = setInterval(() => {
            if (isBotInGuild === false) checkBot();
        }, 3000);

        return () => clearInterval(interval);
    }, [guildId, isBotInGuild, API_URL]);

    return (
        <UnsavedChangesProvider>
            <div className="flex bg-background min-h-screen font-sans overflow-hidden relative selection:bg-primary selection:text-white">
                
                {/* Mobile Sidebar Overlay */}
                <div 
                    className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-[160] w-64 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                    <Sidebar guildId={guildId} onClose={() => setIsSidebarOpen(false)} />
                </div>
                
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-screen relative min-w-0">
                    
                    {/* Top Bar */}
                    <div className="h-16 border-b border-border flex justify-between lg:justify-end items-center px-4 lg:px-8 shrink-0 bg-background/95 backdrop-blur z-[100]">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-secondary hover:text-foreground transition-colors rounded-md hover:bg-card active:scale-95">
                            <Menu className="w-6 h-6" />
                        </button>
                        <ProfileMenu />
                    </div>

                    {/* Page Content / Loading / Invite */}
                    {isBotInGuild === null ? (
                        <LoadingView />
                    ) : isBotInGuild === false ? (
                        <InviteView inviteUrl={inviteUrl} />
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
                            {children}
                        </div>
                    )}
                </div>
            </div>
        </UnsavedChangesProvider>
    );
}