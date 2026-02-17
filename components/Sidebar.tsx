"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { X, ChevronDown, Check, Server, Megaphone, CornerDownRight, LayoutGrid, LogIn, LogOut, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesContext';

interface Guild {
    id: string;
    name: string;
    icon: string | null;
    bot_in_guild: boolean;
}

export default function Sidebar({ guildId, onClose }: { guildId?: string, onClose?: () => void }) {
    const pathname = usePathname();
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAnnounceExpanded, setIsAnnounceExpanded] = useState(false);
    
    // 🔥 แก้ไข 1: เริ่มต้นเป็นค่าว่าง (ไม่ Hardcode ชื่อ)
    const [botName, setBotName] = useState("");
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { isDirty, triggerShake } = useUnsavedChanges();

    useEffect(() => {
        // 🔥 แก้ไข: เช็คทั้ง 2 กรณี เพื่อให้ปิดอัตโนมัติเมื่อออกจากหน้า announcements
        if (pathname?.includes('/announcements')) {
            setIsAnnounceExpanded(true);
        } else {
            setIsAnnounceExpanded(false);
        }
    }, [pathname]);

    const handleNavigation = (e: React.MouseEvent, href: string) => {
        if (isDirty) { 
            e.preventDefault(); 
            triggerShake(); 
        } else { 
            if (onClose) onClose(); 
            setIsDropdownOpen(false); 
        }
    };

    useEffect(() => {
        // Fetch Guilds
        fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setGuilds(data.filter(g => g.bot_in_guild)); })
            .catch(console.error);
        
        // 🔥 Fetch Bot Info: ดึงชื่อจาก API เท่านั้น
        fetch(`${API_URL}/api/guilds/bot-info`)
            .then(res => res.json())
            .then(data => { if (data.name) setBotName(data.name); })
            .catch(console.error);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [API_URL]);

    const currentGuild = guilds.find(g => g.id === guildId);
    
    const getLinkClass = (path: string) => pathname === path ? "bg-primary/20 text-primary border-l-4 border-primary font-bold shadow-[inset_10px_0_20px_-10px_rgba(56,189,248,0.3)]" : "text-secondary hover:bg-card-hover hover:text-foreground border-l-4 border-transparent";
    const getSubLinkClass = (path: string) => pathname === path ? "text-primary font-bold bg-primary/10 border-r-2 border-primary" : "text-secondary hover:text-foreground hover:bg-card-hover border-r-2 border-transparent";

    return (
        <div className="w-64 bg-card flex flex-col border-r border-border h-full min-h-screen shrink-0 font-sans relative z-40 transition-all duration-300 shadow-2xl">
            <div className="p-3 border-b border-border relative" ref={dropdownRef}>
                
                {/* 🔥 แก้ไข 2: ครอบด้วย Link ไปยังหน้า / พร้อม Handle Navigation */}
                <Link 
                    href="/" 
                    onClick={(e) => handleNavigation(e, "/")}
                    className="px-1 pb-3 flex items-center gap-3 w-full overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shrink-0 shadow-[0_0_10px_#4ade80]"></div>
                    <h1 className="text-xl font-black text-primary tracking-tight truncate w-full drop-shadow-md group-hover:text-primary-hover transition-colors">
                        {/* ถ้ายังโหลดไม่เสร็จ ให้แสดง ... หรือว่างไว้ */}
                        {botName || "..."}
                    </h1>
                </Link>

                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-card-hover cursor-pointer transition-colors duration-200 group select-none bg-background/50 border border-border/50 hover:border-primary/50 shadow-sm">
                    <div className="font-bold text-foreground text-sm truncate flex-1 pr-2 flex items-center gap-2">
                        {currentGuild?.icon ? <img src={`https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.png`} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[10px]">RA</div>}
                        {currentGuild ? currentGuild.name : "เลือกเซิร์ฟเวอร์"}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                    <div className="absolute top-full left-2 right-2 mt-2 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50 max-h-72 overflow-y-auto custom-scrollbar ring-1 ring-white/5">
                        <Link href="/dashboard" onClick={(e) => handleNavigation(e, "/dashboard")} className="flex items-center gap-2 px-3 py-3 text-sm text-secondary hover:bg-primary hover:text-white transition-colors border-b border-border/50">
                            <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center shrink-0 border border-border"><Server className="w-4 h-4"/></div>
                            <span className="font-medium">หน้ารวมเซิร์ฟเวอร์</span>
                        </Link>
                        {guilds.map(g => (
                            <Link key={g.id} href={`/dashboard/${g.id}`} onClick={(e) => handleNavigation(e, `/dashboard/${g.id}`)} className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${g.id === guildId ? 'bg-primary/10 text-primary font-bold' : 'text-secondary hover:bg-card-hover hover:text-foreground'}`}>
                                <img src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="" className="w-7 h-7 rounded-full object-cover border border-border" />
                                <span className="truncate flex-1">{g.name}</span>
                                {g.id === guildId && <Check className="w-4 h-4 text-primary" />}
                            </Link>
                        ))}
                    </div>
                )}
                {onClose && <button onClick={onClose} className="lg:hidden absolute top-4 right-[-34px] bg-card p-2 rounded-r-xl border-y border-r border-border text-secondary hover:text-foreground hover:bg-card-hover shadow-lg"><X className="w-5 h-5" /></button>}
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-1">
                {!guildId ? (
                    <Link href="/dashboard" onClick={(e) => handleNavigation(e, "/dashboard")} className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${getLinkClass('/dashboard')}`}>
                        <LayoutGrid className="w-5 h-5" /> <span className="font-medium">Dashboard</span>
                    </Link>
                ) : (
                    <div className="space-y-1 animate-fade-in-up">
                        <div className="px-4 py-2 text-[10px] font-bold text-secondary/70 uppercase tracking-widest">Main Menu</div>
                        <Link href={`/dashboard/${guildId}`} onClick={(e) => handleNavigation(e, `/dashboard/${guildId}`)} className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 mb-4 ${getLinkClass(`/dashboard/${guildId}`)}`}>
                            <LayoutGrid className="w-5 h-5" /> <span className="font-medium">ภาพรวม (Overview)</span>
                        </Link>

                        <div className="px-4 py-2 text-[10px] font-bold text-secondary/70 uppercase tracking-widest">Systems</div>
                        <div className="space-y-1">
                            <Link 
                                href={`/dashboard/${guildId}/announcements`}
                                onClick={(e) => handleNavigation(e, `/dashboard/${guildId}/announcements`)}
                                className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-200 group ${pathname?.includes('announcements') ? 'bg-card-hover text-foreground' : 'text-secondary hover:bg-card-hover hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Megaphone className={`w-5 h-5 ${pathname?.includes('announcements') ? 'text-primary' : 'text-secondary group-hover:text-primary transition-colors'}`} />
                                    <span className="font-medium">Announcements</span>
                                </div>
                                {/* Icon Chevron จะหมุนตามสถานะ isAnnounceExpanded ซึ่งถูกคุมด้วย useEffect */}
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isAnnounceExpanded ? 'rotate-180 text-primary' : 'text-secondary/50'}`} />
                            </Link>

                            {/* --- เมนูย่อย (ลบ "ตั้งค่ารวม" ออกแล้ว) --- */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAnnounceExpanded ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="ml-5 pl-4 border-l-2 border-border/50 space-y-1 py-1">
                                    {/* ลบ Link "ตั้งค่ารวม" ออกไปแล้ว */}
                                    
                                    <Link href={`/dashboard/${guildId}/announcements/join`} onClick={(e) => handleNavigation(e, `/dashboard/${guildId}/announcements/join`)} className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all text-sm ${getSubLinkClass(`/dashboard/${guildId}/announcements/join`)}`}><LogIn className="w-3 h-3 opacity-70" /> ข้อความต้อนรับ</Link>
                                    <Link href={`/dashboard/${guildId}/announcements/leave`} onClick={(e) => handleNavigation(e, `/dashboard/${guildId}/announcements/leave`)} className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all text-sm ${getSubLinkClass(`/dashboard/${guildId}/announcements/leave`)}`}><LogOut className="w-3 h-3 opacity-70" /> ข้อความอำลา</Link>
                                    <Link href={`/dashboard/${guildId}/announcements/boost`} onClick={(e) => handleNavigation(e, `/dashboard/${guildId}/announcements/boost`)} className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all text-sm ${getSubLinkClass(`/dashboard/${guildId}/announcements/boost`)}`}><Zap className="w-3 h-3 opacity-70" /> ข้อความบูสต์</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border bg-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent-hover flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse-slow">
                        <span className="text-[10px] font-black text-white">RA</span>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-foreground tracking-wide">{botName || "..."}</div>
                        <div className="text-[9px] text-secondary">Dashboard v2.0</div>
                    </div>
                </div>
            </div>
        </div>
    );
}