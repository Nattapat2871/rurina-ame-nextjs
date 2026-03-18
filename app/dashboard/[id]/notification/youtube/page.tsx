"use client";

import { useEffect, useState, useRef, ChangeEvent, MouseEvent as ReactMouseEvent, FormEvent, memo } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Save, RotateCcw, Youtube, Hash, AtSign, MessageSquare, MonitorPlay, Lightbulb, Bell, Layers, Link as LinkIcon, Check, ChevronDown, Trash2, Plus, BookOpen, Type, X } from 'lucide-react';
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesContext';

// --- Interfaces ---
interface Channel { id: string; name: string; category?: string; }
interface Role { id: string; name: string; color?: string; }

interface YouTubeSubscription {
    id: string; 
    isEnabled: boolean;
    ytChannelUrl: string;
    ytChannelName: string; 
    ytChannelAvatar: string; 
    targetChannelId: string;
    pingRoles: string[];
    message: string;
    useEmbed: boolean;
    notifyVideos: boolean;
    notifyShorts: boolean;
    notifyLives: boolean;
}

const YOUTUBE_VARS = [
    { name: "yt.channel", desc: "ชื่อช่อง YouTube" },
    { name: "yt.url", desc: "ลิงก์ช่อง YouTube" },
    { name: "video.title", desc: "ชื่อคลิป / ชื่อสตรีม" },
    { name: "video.url", desc: "ลิงก์คลิป" },
    { name: "role", desc: "Ping ยศที่เลือกไว้" },
    { name: "server.name", desc: "ชื่อเซิร์ฟเวอร์" }
];

// --- Component: SmartInput ---
interface SmartInputProps { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; isTextarea?: boolean; maxLength?: number; }
const SmartInput = memo(({ value, onChange, placeholder, className, isTextarea = false, maxLength }: SmartInputProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value; onChange(val);
        const cursor = e.target.selectionStart; if (cursor === null) return;
        const textBeforeCursor = val.slice(0, cursor); const match = textBeforeCursor.match(/\{([a-zA-Z0-9._]*)$/);
        if (match) { setShowMenu(true); setFilter(match[1].toLowerCase()); } else { setShowMenu(false); }
    };

    const insertVar = (varName: string) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart; if (cursor === null) return;
        const textBeforeCursor = value.slice(0, cursor); const textAfterCursor = value.slice(cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z0-9._]*)$/);
        if (match) {
            const startPos = cursor - match[1].length - 1; const newText = value.slice(0, startPos) + `{${varName}}` + textAfterCursor;
            onChange(newText); setShowMenu(false);
            setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); const newCursorPos = startPos + varName.length + 2; inputRef.current.setSelectionRange(newCursorPos, newCursorPos); } }, 0);
        }
    };

    const inputClasses = `w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 placeholder:text-secondary/50 text-sm ${className || ""}`;

    return (
        <div className="relative w-full">
            {isTextarea ? (
                <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={value} onChange={handleChange} className={`${inputClasses} custom-scrollbar min-h-[120px]`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            ) : (
                <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" value={value} onChange={handleChange} className={inputClasses} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            )}
            {showMenu && (
                <div className="absolute z-50 bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-2 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar animate-in fade-in zoom-in-95 duration-200" style={{ top: '100%', left: 0 }}>
                    {YOUTUBE_VARS.filter(v => v.name.toLowerCase().includes(filter)).map(v => (
                        <div key={v.name} onMouseDown={(e: ReactMouseEvent<HTMLDivElement>) => { e.preventDefault(); insertVar(v.name); }} className="px-3 py-2 hover:bg-red-500/20 cursor-pointer flex justify-between items-center transition-colors border-b border-border/50 last:border-0"><span className="font-bold text-red-400 font-mono text-xs">{`{${v.name}}`}</span><span className="text-secondary text-[10px]">{v.desc}</span></div>
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Component: ChannelSelect ---
interface ChannelSelectProps { channels: Channel[]; selectedChannelId: string; onChange: (channelId: string) => void; }
const ChannelSelect = memo(({ channels, selectedChannelId, onChange }: ChannelSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) { setIsOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedChannel = channels.find(c => c.id === selectedChannelId);

    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div 
                className="min-h-[46px] w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-all duration-300 cursor-pointer flex justify-between items-center text-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedChannel ? (
                    <span className="flex items-center gap-2 font-medium"><Hash className="w-4 h-4 text-secondary/70" />{selectedChannel.name} {selectedChannel.category && <span className="text-secondary/50 text-[11px] font-normal ml-1">| {selectedChannel.category}</span>}</span>
                ) : (
                    <span className="text-secondary/50">-- เลือกห้องดิสคอร์ด --</span>
                )}
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {channels.map(channel => {
                        const isSelected = selectedChannelId === channel.id;
                        return (
                            <div key={channel.id} onClick={() => { onChange(channel.id); setIsOpen(false); }} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-red-500/10 text-red-400' : 'hover:bg-secondary/20 text-foreground'}`}>
                                <div className="flex items-center gap-2.5"><Hash className="w-4 h-4 text-secondary/70 shrink-0" /><span className="text-sm font-medium flex items-center flex-wrap gap-1">{channel.name}{channel.category && <span className="text-secondary/50 text-[11px] font-normal">| {channel.category}</span>}</span></div>
                                {isSelected && <Check className="w-4 h-4 text-red-500 shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

// --- Component: MultiRoleSelect ---
interface MultiRoleSelectProps { roles: Role[]; selectedRoles: string[]; onChange: (roles: string[]) => void; }
const MultiRoleSelect = memo(({ roles, selectedRoles, onChange }: MultiRoleSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) { setIsOpen(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleRole = (roleId: string) => { onChange(selectedRoles.includes(roleId) ? selectedRoles.filter(id => id !== roleId) : [...selectedRoles, roleId]); };
    const removeRole = (e: ReactMouseEvent, roleId: string) => { e.stopPropagation(); onChange(selectedRoles.filter(id => id !== roleId)); };

    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div className="min-h-[46px] w-full bg-secondary/30 text-foreground p-2 rounded-xl border border-border focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 transition-all duration-300 cursor-pointer flex justify-between items-center" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    {selectedRoles.length === 0 && <span className="text-secondary/50 text-sm px-2">-- เลือกยศ --</span>}
                    {selectedRoles.map(id => {
                        const role = roles.find(r => r.id === id); if (!role) return null;
                        return (
                            <span key={id} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-lg text-xs font-medium hover:border-red-500/50 transition-colors shadow-sm group cursor-default">
                                {role.color && role.color !== '#000000' ? (<span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: role.color }}></span>) : (<span className="text-secondary font-bold">@</span>)}
                                {role.name} <button type="button" onClick={(e) => removeRole(e, id)} className="text-secondary group-hover:text-red-500 ml-0.5 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                            </span>
                        );
                    })}
                </div>
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {roles.map(role => {
                        const isSelected = selectedRoles.includes(role.id);
                        return (
                            <div key={role.id} onClick={() => toggleRole(role.id)} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-red-500/10 text-red-400' : 'hover:bg-secondary/20 text-foreground'}`}>
                                <div className="flex items-center gap-2.5">{role.color && role.color !== '#000000' ? (<span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: role.color }}></span>) : (<span className="text-secondary/70 font-bold bg-secondary/10 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">@</span>)}<span className="text-sm font-medium">{role.name}</span></div>
                                {isSelected && <Check className="w-4 h-4 text-red-500" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

// 🔥 ฟังก์ชันดึงรูปภาพและชื่อช่องจากหน้าเว็บ YouTube โดยตรงผ่าน AllOrigins Proxy (แก้ปัญหา API ถูกบล็อก)
const fetchYouTubeInfo = async (url: string) => {
    try {
        let targetUrl = url;
        if (!url.includes('youtube.com')) {
            const handle = url.startsWith('@') ? url : `@${url}`;
            targetUrl = `https://www.youtube.com/${handle}`;
        }

        // ดึง Source Code หน้าเว็บของ YouTube ทะลุ CORS โดยใช้ allorigins
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
        const data = await response.json();
        
        if (!data || !data.contents) return null;
        const html = data.contents;
        
        // ใช้ Regex แกะ Meta Tags ที่ YouTube ฝังไว้ (แม่นยำ 100%)
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);

        let avatarUrl = "https://cdn-icons-png.flaticon.com/512/1384/1384060.png";
        if (imgMatch && imgMatch[1]) {
            avatarUrl = imgMatch[1];
        }

        let channelName = targetUrl.split('/').pop() || "YouTube Channel";
        if (titleMatch && titleMatch[1]) {
            channelName = titleMatch[1];
        }

        return {
            avatar: avatarUrl,
            name: channelName
        };
    } catch (error) {
        console.error("Error fetching YouTube Info:", error);
        return null;
    }
};

export default function YouTubePage() {
    const params = useParams(); const guildId = params.id as string; 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const { setIsDirty: setGlobalDirty, shouldShake } = useUnsavedChanges();
    
    // Core Data
    const [channels, setChannels] = useState<Channel[]>([]); 
    const [roles, setRoles] = useState<Role[]>([]);
    
    // Help Modal State
    const [isHelpModalMounted, setIsHelpModalMounted] = useState(false); 
    const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
    const openHelpModal = () => { setIsHelpModalMounted(true); setTimeout(() => setIsHelpModalVisible(true), 10); };
    const closeHelpModal = () => { setIsHelpModalVisible(false); setTimeout(() => setIsHelpModalMounted(false), 300); };

    // --- State สำหรับเก็บรายการช่องที่บันทึกแล้ว ---
    const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>([]);
    const [initialSubscriptions, setInitialSettings] = useState<YouTubeSubscription[] | null>(null); 
    const [isDirty, setIsDirty] = useState(false);

    // --- State สำหรับฟอร์มเพิ่ม/แก้ไขช่อง ---
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formEnabled, setFormEnabled] = useState(true);
    const [ytChannelUrl, setYtChannelUrl] = useState("");
    const [targetChannelId, setTargetChannelId] = useState("");
    const [pingRoles, setPingRoles] = useState<string[]>([]);
    const [message, setMessage] = useState("เฮ้ {role}! ช่อง **{yt.channel}** ลงคลิปใหม่แล้ว! ไปดูกันเลย:\n{video.title}\n{video.url}");
    const [useEmbed, setUseEmbed] = useState(true);
    const [notifyVideos, setNotifyVideos] = useState(true);
    const [notifyShorts, setNotifyShorts] = useState(false);
    const [notifyLives, setNotifyLives] = useState(true);

    // Mock Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const botRes = await fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(r=>r.json()).catch(() => ({}));
                setChannels(botRes.channels || [{ id: "1", name: "general" }]);
                setRoles(botRes.roles || [{ id: "101", name: "Everyone" }]);

                // TODO: เปลี่ยนให้ดึงข้อมูล array มาจาก Backend (ในอนาคต)
                const fetchedList: YouTubeSubscription[] = [];

                setSubscriptions(fetchedList);
                setInitialSettings(fetchedList);
            } catch (err) { console.error("Error fetching data", err); }
        }; 
        fetchData();
    }, [guildId, API_URL]);

    // Check for changes 
    useEffect(() => { 
        if (!initialSubscriptions) return; 
        setIsDirty(JSON.stringify(subscriptions) !== JSON.stringify(initialSubscriptions)); 
    }, [subscriptions, initialSubscriptions]);
    
    // Register to Context
    useEffect(() => {
        setGlobalDirty(isDirty);
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => { setGlobalDirty(false); window.removeEventListener('beforeunload', handleBeforeUnload); };
    }, [isDirty, setGlobalDirty]);

    // จัดการเพิ่ม/อัปเดตช่องลงใน List
    const handleAddOrUpdateChannel = async () => {
        if (!ytChannelUrl.trim()) {
            Swal.fire({ title: 'เกิดข้อผิดพลาด', text: 'กรุณากรอกลิงก์หรือชื่อช่อง YouTube', icon: 'warning', background: '#0f172a', color: '#f1f5f9' });
            return;
        }
        if (!targetChannelId) {
            Swal.fire({ title: 'เกิดข้อผิดพลาด', text: 'กรุณาเลือกห้องดิสคอร์ดสำหรับส่งแจ้งเตือน', icon: 'warning', background: '#0f172a', color: '#f1f5f9' });
            return;
        }

        Swal.fire({ title: 'กำลังดึงข้อมูลช่อง...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });

        // 🔥 ดึงรูปและชื่อช่องจากฟังก์ชัน Scrape หน้าเว็บ YouTube
        const ytInfo = await fetchYouTubeInfo(ytChannelUrl);
        let ytName = ytInfo?.name || ytChannelUrl.split('/').pop() || "YouTube Channel";
        let ytAvatar = ytInfo?.avatar || "https://cdn-icons-png.flaticon.com/512/1384/1384060.png";

        Swal.close();

        const newSub: YouTubeSubscription = {
            id: isEditing && editId ? editId : Date.now().toString(),
            isEnabled: formEnabled,
            ytChannelUrl,
            ytChannelName: ytName,
            ytChannelAvatar: ytAvatar,
            targetChannelId, pingRoles, message, useEmbed, notifyVideos, notifyShorts, notifyLives
        };

        if (isEditing) {
            setSubscriptions(prev => prev.map(sub => sub.id === editId ? newSub : sub));
            setIsEditing(false);
            setEditId(null);
        } else {
            if (subscriptions.length >= 10) {
                Swal.fire({ title: 'จำกัดจำนวน', text: 'สามารถเพิ่มช่องได้สูงสุด 10 ช่องต่อเซิร์ฟเวอร์เท่านั้น', icon: 'warning', background: '#0f172a', color: '#f1f5f9' });
                return;
            }
            setSubscriptions(prev => [newSub, ...prev]);
        }

        resetForm();
    };

    const resetForm = () => {
        setYtChannelUrl(""); setTargetChannelId(""); setPingRoles([]); 
        setMessage("เฮ้ {role}! ช่อง **{yt.channel}** ลงคลิปใหม่แล้ว! ไปดูกันเลย:\n{video.title}\n{video.url}");
        setUseEmbed(true); setNotifyVideos(true); setNotifyShorts(false); setNotifyLives(true);
        setFormEnabled(true); setIsEditing(false); setEditId(null);
    }

    const editChannel = (sub: YouTubeSubscription) => {
        setIsEditing(true);
        setEditId(sub.id);
        setFormEnabled(sub.isEnabled);
        setYtChannelUrl(sub.ytChannelUrl);
        setTargetChannelId(sub.targetChannelId);
        setPingRoles(sub.pingRoles);
        setMessage(sub.message);
        setUseEmbed(sub.useEmbed);
        setNotifyVideos(sub.notifyVideos);
        setNotifyShorts(sub.notifyShorts);
        setNotifyLives(sub.notifyLives);
        
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const toggleChannelStatus = (id: string, enabled: boolean) => {
        setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, isEnabled: enabled } : sub));
    };

    const deleteChannel = (id: string) => {
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "หากลบแล้ว บอทจะหยุดแจ้งเตือนช่องนี้ทันที",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#334155',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            background: '#0f172a', color: '#f1f5f9'
        }).then((result) => {
            if (result.isConfirmed) {
                setSubscriptions(prev => prev.filter(sub => sub.id !== id));
            }
        });
    };

    const handleSaveAPI = async () => { 
        try {
            Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });
            
            setTimeout(() => {
                Swal.fire({ title: 'บันทึกสำเร็จ!', text: 'อัปเดตรายการช่องเรียบร้อยแล้ว', icon: 'success', background: '#0f172a', color: '#f1f5f9', timer: 1500 }); 
                setInitialSettings(subscriptions); 
                setIsDirty(false); 
            }, 800);

        } catch (e) {
            Swal.fire({ title: 'ข้อผิดพลาด!', text: 'ไม่สามารถเชื่อมต่อเพื่อบันทึกข้อมูลได้', icon: 'error', background: '#0f172a', color: '#f1f5f9' });
        }
    };
    
    const handleResetAPI = () => { 
        if (initialSubscriptions) setSubscriptions(initialSubscriptions); 
        resetForm();
    };

    return (
        <div className="flex flex-col pb-32 p-4 md:p-8 min-h-screen max-w-[1920px] mx-auto bg-background/50 font-sans">
            <div className="flex justify-between items-center mb-6 md:mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight drop-shadow-md flex items-center gap-3">
                        <Youtube className="w-8 h-8 md:w-10 md:h-10 text-red-500" /> YouTube Notifications
                    </h1>
                    <p className="text-secondary mt-1 md:mt-2 text-sm md:text-lg">แจ้งเตือนคลิปใหม่และไลฟ์สตรีมจากช่องยูทูปอัตโนมัติ</p>
                </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 md:mb-8 bg-red-900/10 border border-red-500/20 p-4 md:p-5 rounded-2xl flex gap-3 md:gap-4 items-start animate-fade-in-up shadow-lg shadow-red-900/5" style={{ animationDelay: '0.05s' }}>
                <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-sm md:text-sm text-gray-300 leading-relaxed">
                    <span className="text-red-400 font-bold text-base">ระบบทำงานอย่างไร?</span>
                    <p className="mt-1">บอทจะทำการตรวจสอบคลิปใหม่จากช่อง YouTube ที่ระบุไว้ และส่งข้อความแจ้งเตือนไปยังห้องที่เลือกทันที คุณสามารถเพิ่มได้สูงสุด 10 ช่องต่อเซิร์ฟเวอร์</p>
                </div>
            </div>

            {/* 🔥 Added Channels List */}
            {subscriptions.length > 0 && (
                <div className="bg-card backdrop-blur-md p-5 md:p-6 rounded-3xl border border-border shadow-xl hover:shadow-red-500/5 transition-all duration-300 animate-fade-in-up mb-8" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-3">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Layers className="w-5 h-5 text-red-500" /> ช่องที่ติดตามแล้ว
                        </h2>
                        <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold">
                            {subscriptions.length} / 10
                        </span>
                    </div>
                    
                    {/* Scrollable Area */}
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {subscriptions.map(sub => (
                            <div key={sub.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-secondary/10 p-4 rounded-xl border transition-all duration-300 ${!sub.isEnabled ? 'border-border/50 grayscale-[50%] opacity-60' : 'border-border hover:border-red-500/30'}`}>
                                <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                    {/* 🔥 รูปโปรไฟล์ดึงมาจาก YouTube ตรงๆ เลย */}
                                    <img src={sub.ytChannelAvatar} alt="Channel" onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/1384/1384060.png" }} className="w-12 h-12 rounded-full object-cover shrink-0 border border-border shadow-sm" />
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="font-bold text-foreground text-sm truncate hover:text-red-400 cursor-pointer" onClick={() => editChannel(sub)}>
                                            {sub.ytChannelName || sub.ytChannelUrl}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                            <span className="text-[10px] text-secondary flex items-center gap-1"><Hash className="w-3 h-3"/> {channels.find(c => c.id === sub.targetChannelId)?.name || "Unknown"}</span>
                                            <span className="text-secondary/50 text-[10px]">•</span>
                                            {sub.notifyVideos && <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/30">Video</span>}
                                            {sub.notifyShorts && <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30">Shorts</span>}
                                            {sub.notifyLives && <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded border border-green-500/30">Live</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 justify-between sm:justify-end">
                                    <label className="relative inline-flex items-center cursor-pointer group">
                                        <span className="mr-2 text-xs font-medium text-secondary">{sub.isEnabled ? 'เปิด' : 'ปิด'}</span>
                                        <input type="checkbox" className="sr-only peer" checked={sub.isEnabled} onChange={(e) => toggleChannelStatus(sub.id, e.target.checked)} />
                                        <div className="relative w-9 h-5 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {/* 🔥 เพิ่ม Tooltip สำหรับปุ่มแก้ไข */}
                                        <div className="relative group/btn flex items-center justify-center">
                                            <button onClick={() => editChannel(sub)} className="p-2 bg-secondary/20 hover:bg-primary/20 text-secondary hover:text-primary rounded-lg transition-colors"><Layers className="w-4 h-4" /></button>
                                            <span className="absolute -top-10 bg-[#1e293b] border border-border text-white text-[10px] px-2.5 py-1.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">แก้ไขช่องนี้</span>
                                        </div>
                                        {/* 🔥 เพิ่ม Tooltip สำหรับปุ่มลบ */}
                                        <div className="relative group/btn flex items-center justify-center">
                                            <button onClick={() => deleteChannel(sub.id)} className="p-2 bg-secondary/20 hover:bg-red-500/20 text-secondary hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            <span className="absolute -top-10 bg-[#1e293b] border border-border text-white text-[10px] px-2.5 py-1.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">ลบช่องนี้</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Section */}
            <div className={`transition-all duration-300 ${!formEnabled && isEditing ? 'opacity-60 grayscale-[30%]' : 'opacity-100'} ${subscriptions.length >= 10 && !isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl mb-6">
                    <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                        <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                            {isEditing ? <><RotateCcw className="w-5 h-5 text-yellow-500" /> แก้ไขการตั้งค่าช่อง</> : <><Plus className="w-5 h-5 text-green-500" /> เพิ่มช่อง YouTube ใหม่</>}
                        </h2>
                        {isEditing ? (
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer group">
                                    <span className="mr-2 text-xs font-medium text-secondary">{formEnabled ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}</span>
                                    <input type="checkbox" className="sr-only peer" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} />
                                    <div className="relative w-10 h-5 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                </label>
                                <button onClick={resetForm} className="text-xs text-secondary hover:text-white px-2 py-1 bg-secondary/20 rounded">ยกเลิกการแก้ไข</button>
                            </div>
                        ) : (
                            <span className="text-xs text-secondary">{subscriptions.length}/10 ช่อง</span>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* 1. YouTube Channel & Types */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2 tracking-wide flex items-center gap-1">YouTube Channel URL หรือ @Username <span className="text-red-500">*</span></label>
                                <p className="text-secondary/70 text-xs mb-3">วางลิงก์ช่อง (เช่น https://www.youtube.com/@Koyamie) หรือไอดีช่อง</p>
                                <div className="relative flex items-center">
                                    <LinkIcon className="absolute left-3 w-4 h-4 text-secondary/50" />
                                    <input type="text" value={ytChannelUrl} onChange={(e) => setYtChannelUrl(e.target.value)} placeholder="https://www.youtube.com/@..." className="w-full bg-secondary/30 text-foreground p-3 pl-9 rounded-xl border border-border focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-3 tracking-wide">ประเภทวิดีโอที่ต้องการแจ้งเตือน (Categories)</label>
                                <div className="flex flex-wrap gap-3">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all border ${notifyVideos ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-secondary/10 border-border text-secondary hover:bg-secondary/20'}`}>
                                        <input type="checkbox" checked={notifyVideos} onChange={(e) => setNotifyVideos(e.target.checked)} className="hidden" />
                                        <MonitorPlay className="w-4 h-4" /> <span className="text-sm font-medium">Videos (คลิปปกติ)</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all border ${notifyShorts ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-secondary/10 border-border text-secondary hover:bg-secondary/20'}`}>
                                        <input type="checkbox" checked={notifyShorts} onChange={(e) => setNotifyShorts(e.target.checked)} className="hidden" />
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.77,10.32l-1.2-.5L18,9.06a3.74,3.74,0,0,0-3.5-6.62L6,6.94a3.74,3.74,0,0,0,.23,6.74l1.2.49L6,14.93a3.75,3.75,0,0,0,3.5,6.63l8.5-4.5a3.74,3.74,0,0,0-.23-6.74ZM10,14.56V9.44l4.5,2.56Z" /></svg>
                                        <span className="text-sm font-medium">Shorts</span>
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all border ${notifyLives ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-secondary/10 border-border text-secondary hover:bg-secondary/20'}`}>
                                        <input type="checkbox" checked={notifyLives} onChange={(e) => setNotifyLives(e.target.checked)} className="hidden" />
                                        <Bell className="w-4 h-4" /> <span className="text-sm font-medium">Livestreams</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border/50"></div>

                        {/* 2. Target Channel & Roles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2 tracking-wide">ห้องดิสคอร์ด (Discord Channel) <span className="text-red-500">*</span></label>
                                <p className="text-secondary/70 text-xs mb-3">เลือกห้องที่จะให้บอทส่งแจ้งเตือนไป</p>
                                <ChannelSelect channels={channels} selectedChannelId={targetChannelId} onChange={setTargetChannelId} />
                            </div>
                            <div className="relative z-10">
                                <label className="block text-secondary text-xs font-bold uppercase mb-2 tracking-wide flex items-center gap-1"><AtSign className="w-3 h-3"/> ยศที่จะแจ้งเตือน (Roles to Ping)</label>
                                <p className="text-secondary/70 text-xs mb-3">เลือกยศที่ต้องการ Mention (เลือกได้หลายอัน)</p>
                                <MultiRoleSelect roles={roles} selectedRoles={pingRoles} onChange={setPingRoles} />
                            </div>
                        </div>

                        <div className="border-t border-border/50"></div>

                        {/* 3. Message Template */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-secondary text-xs font-bold uppercase tracking-wide">รูปแบบข้อความ (Message)</label>
                                    <div className="flex items-center gap-4">
                                        <button onClick={openHelpModal} className="flex items-center gap-1.5 bg-secondary/30 hover:bg-red-500/20 active:scale-95 border border-border px-2.5 py-1 rounded-lg text-secondary transition-all duration-300 hover:text-red-500 shadow-sm text-[10px] font-medium group">
                                            <BookOpen className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform duration-300" /><span>คู่มือ & Markdown</span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-secondary uppercase font-bold">ส่งเป็น Embed</span>
                                            <label className="relative inline-flex items-center cursor-pointer group"><input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} /><div className="relative w-8 h-4 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div></label>
                                        </div>
                                    </div>
                                </div>
                                <SmartInput isTextarea value={message} onChange={setMessage} placeholder="พิมพ์ข้อความที่นี่..." maxLength={2000} />
                            </div>

                            {/* Preview Box Simplified */}
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-4 tracking-wide">ตัวอย่างการแสดงผล (Preview)</label>
                                <div className="bg-[#313338] p-4 rounded-xl text-[#dbdee1] border border-border/50 shadow-inner h-[160px] overflow-y-auto custom-scrollbar">
                                    <div className="flex items-start gap-3">
                                        <img src="https://cdn.discordapp.com/embed/avatars/0.png" className="w-10 h-10 rounded-full" alt="Bot" />
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-medium text-white text-sm">Rurina Ame</span>
                                                <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded font-bold">BOT</span>
                                            </div>
                                            <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                                                {message.replace(/\{role\}/g, pingRoles.length > 0 ? pingRoles.map(id => `@${roles.find(r => r.id === id)?.name}`).join(' ') : '@YouTube Ping')
                                                        .replace(/\{yt\.channel\}/g, ytChannelUrl.split('@').pop() || 'Koyamie')
                                                        .replace(/\{video\.title\}/g, 'ไลฟ์สดเล่นเกมชิลๆ วันหยุด 🎮')
                                                        .replace(/\{video\.url\}/g, 'https://youtu.be/dQw4w9WgXcQ')}
                                            </div>
                                            {useEmbed && (
                                                <div className="mt-2 bg-[#2b2d31] border-l-4 border-red-500 p-3 rounded flex flex-col gap-1 max-w-sm">
                                                    <span className="text-xs font-bold text-white">YouTube</span>
                                                    <span className="text-sm font-bold text-blue-400 hover:underline cursor-pointer">ไลฟ์สดเล่นเกมชิลๆ วันหยุด 🎮</span>
                                                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&h=225&fit=crop" className="mt-2 rounded object-cover w-full h-auto" alt="Thumb" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* ปุ่มเพิ่มเข้า List */}
                        <div className="pt-4 flex justify-end">
                            <button onClick={handleAddOrUpdateChannel} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-2">
                                {isEditing ? <><Save className="w-4 h-4"/> บันทึกการแก้ไข (เข้าลิสต์)</> : <><Plus className="w-4 h-4"/> เพิ่มลงในรายการแจ้งเตือน</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:ml-64 flex justify-center items-center transition-all duration-500 transform pointer-events-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-[70]`}>
                <div className={`pointer-events-auto bg-[#111214]/95 backdrop-blur-md border border-border p-3 md:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-500 ${shouldShake ? 'animate-shake-error' : ''}`}>
                    <span className="text-white font-medium flex items-center gap-2 pl-2 text-sm md:text-base"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>คุณมีการเปลี่ยนแปลงช่องที่ยังไม่ได้ส่งขึ้นเซิร์ฟเวอร์</span>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button type="button" onClick={handleResetAPI} className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-secondary hover:text-foreground px-3 md:px-4 py-2 rounded-xl hover:bg-secondary/20 transition-all font-medium text-xs md:text-sm"><RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> รีเซ็ต</button>
                        <button type="submit" onClick={handleSaveAPI} className="flex-1 sm:flex-none justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm"><Save className="w-3 h-3 md:w-4 md:h-4" /> ยืนยันการตั้งค่าระบบ</button>
                    </div>
                </div>
            </div>

            {/* Help Modal */}
            {isHelpModalMounted && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isHelpModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeHelpModal}>
                    <div className={`bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden transition-all duration-300 ease-out transform ${isHelpModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`} onClick={e => e.stopPropagation()}>
                        <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-secondary/10 shrink-0">
                            <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><span className="font-mono bg-secondary/20 px-2 py-1 rounded text-red-500 shadow-sm">{`{}`}</span> คู่มือ & Markdown</h3>
                            <button onClick={closeHelpModal} className="text-secondary hover:text-foreground hover:bg-secondary/20 p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 md:space-y-8">
                            <section>
                                <h4 className="text-foreground font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Layers className="w-4 h-4 md:w-5 md:h-5 text-red-500" /> ตัวแปรที่ใช้ได้ (Variables)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                    {YOUTUBE_VARS.map((v, i) => (
                                        <div key={v.name} className={`bg-secondary/10 p-2 md:p-3 rounded-xl border border-border flex flex-col gap-1 hover:border-red-500 hover:shadow-md transition-all duration-500 ease-out transform ${isHelpModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${i * 30}ms` }}>
                                            <span className="font-mono text-foreground font-bold text-xs md:text-sm bg-secondary/20 px-2 py-0.5 rounded w-fit">{`{${v.name}}`}</span>
                                            <span className="text-secondary text-[10px] md:text-xs">{v.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section>
                                <h4 className="text-foreground font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Type className="w-4 h-4 md:w-5 md:h-5 text-red-500" /> การจัดรูปแบบข้อความ (Discord Markdown)</h4>
                                <div className={`bg-secondary/10 rounded-xl border border-border overflow-x-auto hover:border-red-500/50 transition-all duration-500 ease-out transform shadow-sm ${isHelpModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
                                    <table className="w-full text-left text-xs md:text-sm min-w-[400px]">
                                        <thead className="bg-secondary/20 border-b border-border text-secondary">
                                            <tr><th className="p-2 md:p-3 font-semibold w-1/2">พิมพ์แบบนี้</th><th className="p-2 md:p-3 font-semibold w-1/2">ผลลัพธ์ที่ได้</th></tr>
                                        </thead>
                                        <tbody className="text-foreground divide-y divide-border">
                                            <tr className="hover:bg-secondary/20 transition-colors"><td className="p-2 md:p-3 font-mono">**ตัวหนา**</td><td className="p-2 md:p-3"><strong>ตัวหนา</strong></td></tr>
                                            <tr className="hover:bg-secondary/20 transition-colors"><td className="p-2 md:p-3 font-mono">*ตัวเอียง* หรือ _ตัวเอียง_</td><td className="p-2 md:p-3"><em className="italic">ตัวเอียง</em></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}