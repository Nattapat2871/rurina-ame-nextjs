"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronDown, Check, Server } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Interface สำหรับข้อมูล Guild
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
    const dropdownRef = useRef<HTMLDivElement>(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // โหลดรายชื่อกิลด์
    useEffect(() => {
        fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setGuilds(data.filter(g => g.bot_in_guild));
            })
            .catch(console.error);

        // ปิด Dropdown เมื่อคลิกข้างนอก
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [API_URL]);

    const currentGuild = guilds.find(g => g.id === guildId);
    
    // ฟังก์ชันเช็คว่าลิงก์ไหน Active อยู่
    const isActive = (path: string) => pathname === path 
        ? "bg-[#404249] text-white border-l-4 border-[#5865f2]" 
        : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]";

    return (
        <div className="w-64 bg-[#2b2d31] flex flex-col border-r border-[#1e1f22] h-full min-h-screen shrink-0 font-sans relative z-40 transition-all duration-300">
            {/* Header / Dropdown */}
            <div className="p-3 border-b border-[#1e1f22] relative" ref={dropdownRef}>
                <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#35373c] cursor-pointer transition-colors duration-200 group select-none"
                >
                    <div className="font-bold text-white text-md truncate flex-1 pr-2">
                        {currentGuild ? currentGuild.name : "🤖 Rurina-Ame"}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#949ba4] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-2 right-2 mt-1 bg-[#111214] border border-[#1e1f22] rounded-lg shadow-2xl overflow-hidden animate-scale-in z-50 max-h-64 overflow-y-auto custom-scrollbar">
                        <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#dbdee1] hover:bg-[#5865f2] hover:text-white transition-colors">
                            <div className="w-8 h-8 rounded-full bg-[#313338] flex items-center justify-center shrink-0 border border-[#1e1f22]">
                                🏠
                            </div>
                            <span className="font-medium">หน้ารวมเซิร์ฟเวอร์</span>
                        </Link>
                        <div className="border-t border-[#1e1f22] my-1"></div>
                        {guilds.map(g => (
                            <Link 
                                key={g.id} 
                                href={`/dashboard/${g.id}/announcements`}
                                onClick={() => setIsDropdownOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${g.id === guildId ? 'bg-[#404249] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]'}`}
                            >
                                <img 
                                    src={g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} 
                                    alt="" 
                                    className="w-8 h-8 rounded-full object-cover border border-[#1e1f22]"
                                />
                                <span className="truncate flex-1">{g.name}</span>
                                {g.id === guildId && <Check className="w-4 h-4 text-[#23a559]" />}
                            </Link>
                        ))}
                    </div>
                )}

                {/* ปุ่มปิด Sidebar บนมือถือ */}
                {onClose && (
                    <button onClick={onClose} className="lg:hidden absolute top-4 right-[-30px] bg-[#2b2d31] p-1 rounded-r-md border-y border-r border-[#1e1f22] text-[#949ba4]">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar space-y-1">
                {/* เมนูหลัก */}
                {!guildId && (
                    <Link href="/dashboard" onClick={onClose} className={`mx-2 px-3 py-2 rounded-md flex items-center gap-3 transition-all duration-200 ${isActive('/dashboard')}`}>
                        <Server className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </Link>
                )}

                {/* เมนูย่อยเมื่อเลือก Guild */}
                {guildId && (
                    <div className="animate-fade-in">
                        <div className="px-4 py-3 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">Features</div>
                        
                        <Link href={`/dashboard/${guildId}/announcements`} onClick={onClose} className={`block py-2 px-4 mx-2 rounded-md transition-all duration-200 ${pathname === `/dashboard/${guildId}/announcements` ? "bg-[#404249] text-white border-l-4 border-[#5865f2]" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"}`}>
                            📢 ภาพรวม (Overview)
                        </Link>
                        
                        <Link href={`/dashboard/${guildId}/announcements/join`} onClick={onClose} className={`block py-2 px-4 mx-2 rounded-md transition-all duration-200 ${pathname === `/dashboard/${guildId}/announcements/join` ? "bg-[#404249] text-white border-l-4 border-[#5865f2]" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"}`}>
                            👋 ข้อความต้อนรับ (Join)
                        </Link>
                        
                        <Link href={`/dashboard/${guildId}/announcements/leave`} onClick={onClose} className={`block py-2 px-4 mx-2 rounded-md transition-all duration-200 ${pathname === `/dashboard/${guildId}/announcements/leave` ? "bg-[#404249] text-white border-l-4 border-[#5865f2]" : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"}`}>
                            👋 ข้อความอำลา (Leave)
                        </Link>
                    </div>
                )}
            </div>
            
            <div className="p-4 border-t border-[#1e1f22] bg-[#232428]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-white">RA</span>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white">Rurina-Ame</div>
                        <div className="text-[10px] text-[#949ba4]">v1.0.0 Dashboard</div>
                    </div>
                </div>
            </div>
        </div>
    );
}