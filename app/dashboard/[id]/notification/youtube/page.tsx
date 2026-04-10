"use client";

import { useEffect, useState, useRef, ChangeEvent, MouseEvent as ReactMouseEvent, memo } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Save, RotateCcw, Youtube, Hash, AtSign, MonitorPlay, Lightbulb, Bell, Layers, Link as LinkIcon, Check, ChevronDown, Trash2, Plus, BookOpen, Type, X } from 'lucide-react';
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesContext';

// --- Interfaces ---
interface Channel { id: string; name: string; category?: string; }
interface Role { id: string; name: string; color?: string; }

interface TrackedChannel {
    id: string; 
    ytChannelUrl: string;
    ytChannelName: string; 
    ytChannelAvatar: string; 
}

interface GlobalSettings {
    targetChannelId: string;
    pingRoles: string[];
    notifyVideos: boolean;
    videoMessage: string;
    notifyShorts: boolean;
    shortsMessage: string;
    notifyLives: boolean;
    liveMessage: string;
}

const YOUTUBE_VARS = [
    { name: "yt.channel", desc: "ชื่อช่อง YouTube" },
    { name: "yt.url", desc: "ลิงก์ช่อง YouTube" },
    { name: "video.title", desc: "ชื่อคลิป / ชื่อสตรีม" },
    { name: "video.url", desc: "ลิงก์คลิป" },
    { name: "role", desc: "Ping ยศที่เลือกไว้" },
    { name: "server.name", desc: "ชื่อเซิร์ฟเวอร์" }
];

const DEFAULT_SETTINGS: GlobalSettings = {
    targetChannelId: "", pingRoles: [],
    notifyVideos: true, videoMessage: "เฮ้ {role}! ช่อง **{yt.channel}** ลงคลิปใหม่แล้ว! ไปดูกันเลย:\n{video.title}\n{video.url}",
    notifyShorts: false, shortsMessage: "เฮ้ {role}! ช่อง **{yt.channel}** ลง Shorts ใหม่แล้ว! แวะไปดูกันหน่อย:\n{video.title}\n{video.url}",
    notifyLives: true, liveMessage: "🔴 ด่วน {role}! ช่อง **{yt.channel}** กำลังไลฟ์สดตอนนี้เลย!\n{video.title}\n{video.url}"
};

// --- Component: SmartInput ---
interface SmartInputProps { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; maxLength?: number; }
const SmartInput = memo(({ value, onChange, placeholder, className, maxLength }: SmartInputProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
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

    return (
        <div className="relative w-full">
            <textarea ref={inputRef} value={value} onChange={handleChange} className={`w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 placeholder:text-secondary/50 text-sm custom-scrollbar min-h-[100px] ${className || ""}`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            {showMenu && (
                <div className="absolute z-50 bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-2 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar animate-in fade-in zoom-in-95 duration-200" style={{ top: '100%', left: 0 }}>
                    {YOUTUBE_VARS.filter(v => v.name.toLowerCase().includes(filter)).map(v => (
                        <div key={v.name} onMouseDown={(e) => { e.preventDefault(); insertVar(v.name); }} className="px-3 py-2 hover:bg-red-500/20 cursor-pointer flex justify-between items-center transition-colors border-b border-border/50 last:border-0"><span className="font-bold text-red-400 font-mono text-xs">{`{${v.name}}`}</span><span className="text-secondary text-[10px]">{v.desc}</span></div>
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Component: ChannelSelect & MultiRoleSelect ---
const ChannelSelect = memo(({ channels, selectedChannelId, onChange }: { channels: Channel[]; selectedChannelId: string; onChange: (id: string) => void; }) => {
    const [isOpen, setIsOpen] = useState(false); const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    const selectedChannel = channels.find(c => c.id === selectedChannelId);
    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div className="min-h-[46px] w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus-within:border-red-500 cursor-pointer flex justify-between items-center text-sm" onClick={() => setIsOpen(!isOpen)}>
                {selectedChannel ? <span className="flex items-center gap-2 font-medium"><Hash className="w-4 h-4 text-secondary/70" />{selectedChannel.name}</span> : <span className="text-secondary/50">-- เลือกห้องดิสคอร์ด --</span>}
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                    {channels.map(channel => (
                        <div key={channel.id} onClick={() => { onChange(channel.id); setIsOpen(false); }} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer ${selectedChannelId === channel.id ? 'bg-red-500/10 text-red-400' : 'hover:bg-secondary/20'}`}>
                            <div className="flex items-center gap-2.5"><Hash className="w-4 h-4 text-secondary/70" /><span className="text-sm font-medium">{channel.name}</span></div>
                            {selectedChannelId === channel.id && <Check className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const MultiRoleSelect = memo(({ roles, selectedRoles, onChange }: { roles: Role[]; selectedRoles: string[]; onChange: (roles: string[]) => void; }) => {
    const [isOpen, setIsOpen] = useState(false); const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => { const handleClickOutside = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); }; document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);
    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div className="min-h-[46px] w-full bg-secondary/30 text-foreground p-2 rounded-xl border border-border cursor-pointer flex justify-between items-center" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    {selectedRoles.length === 0 && <span className="text-secondary/50 text-sm px-2">-- เลือกยศ --</span>}
                    {selectedRoles.map(id => {
                        const role = roles.find(r => r.id === id); if (!role) return null;
                        return (
                            <span key={id} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-lg text-xs font-medium hover:border-red-500/50 shadow-sm group cursor-default">
                                {role.color && role.color !== '#000000' ? <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }}></span> : <span className="text-secondary font-bold">@</span>}
                                {role.name} <button type="button" onClick={(e) => { e.stopPropagation(); onChange(selectedRoles.filter(r => r !== id)); }} className="text-secondary group-hover:text-red-500 ml-0.5"><X className="w-3.5 h-3.5" /></button>
                            </span>
                        );
                    })}
                </div>
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 border border-border rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
                    {roles.map(role => {
                        const isSelected = selectedRoles.includes(role.id);
                        return (
                            <div key={role.id} onClick={() => onChange(isSelected ? selectedRoles.filter(id => id !== role.id) : [...selectedRoles, role.id])} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer ${isSelected ? 'bg-red-500/10 text-red-400' : 'hover:bg-secondary/20'}`}>
                                <div className="flex items-center gap-2.5">{role.color && role.color !== '#000000' ? <span className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></span> : <span className="font-bold bg-secondary/10 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">@</span>}<span className="text-sm font-medium">{role.name}</span></div>
                                {isSelected && <Check className="w-4 h-4" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});


export default function YouTubePage() {
    const params = useParams(); const guildId = params.id as string; 
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const { setIsDirty: setGlobalDirty, shouldShake } = useUnsavedChanges();
    
    // Core Data
    const [channels, setChannels] = useState<Channel[]>([]); 
    const [roles, setRoles] = useState<Role[]>([]);
    
    // 🔥 2. แก้ให้ State รอรับข้อมูลจริงจาก API แทนการ Hardcode
    const [botUser, setBotUser] = useState({ name: "Loading...", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" }); 
    const [currentTime, setCurrentTime] = useState("");

    // State 
    const [trackedChannels, setTrackedChannels] = useState<TrackedChannel[]>([]);
    const [initialChannels, setInitialChannels] = useState<TrackedChannel[] | null>(null); 
    const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
    const [initialSettings, setInitialSettings] = useState<GlobalSettings | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Local State
    const [ytInputUrl, setYtInputUrl] = useState("");
    const [previewType, setPreviewType] = useState<'video' | 'shorts' | 'live'>('video');
    const [isHelpModalMounted, setIsHelpModalMounted] = useState(false); 
    const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

    // นาฬิกา Real-time สำหรับ Preview
    useEffect(() => {
        setCurrentTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ดึงข้อมูลห้องและยศ
                const botRes = await fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(r=>r.json()).catch(() => ({}));
                setChannels(botRes.channels || [{ id: "1", name: "general" }]);
                setRoles(botRes.roles || [{ id: "101", name: "Everyone" }]);

                // 🔥 2. ดึงข้อมูลรูปและชื่อของบอทจาก API /bot-info
                const botInfoRes = await fetch(`${API_URL}/api/guilds/bot-info`, { credentials: 'include' }).then(r=>r.json()).catch(() => null);
                if (botInfoRes && botInfoRes.name) {
                    setBotUser({ name: botInfoRes.name, avatar: botInfoRes.avatar });
                } else {
                    setBotUser({ name: "Bot Name", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
                }

                // ดึงการตั้งค่า YouTube
                const ytRes = await fetch(`${API_URL}/api/guilds/${guildId}/notification/youtube`, { credentials: 'include' });
                if (ytRes.ok) {
                    const ytData = await ytRes.json();
                    setTrackedChannels(ytData.channels || []);
                    setInitialChannels(ytData.channels || []);
                    if (ytData.settings) {
                        setSettings(ytData.settings);
                        setInitialSettings(ytData.settings);
                    } else {
                        setInitialSettings(DEFAULT_SETTINGS);
                    }
                }
            } catch (err) { console.error("Error fetching data", err); }
        }; 
        fetchData();
    }, [guildId, API_URL]);

    // Check changes
    useEffect(() => { 
        if (!initialSettings || !initialChannels) return; 
        const isSettingsDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        const isChannelsDirty = JSON.stringify(trackedChannels) !== JSON.stringify(initialChannels);
        setIsDirty(isSettingsDirty || isChannelsDirty); 
    }, [settings, initialSettings, trackedChannels, initialChannels]);
    
    // Context hook
    useEffect(() => {
        setGlobalDirty(isDirty);
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => { setGlobalDirty(false); window.removeEventListener('beforeunload', handleBeforeUnload); };
    }, [isDirty, setGlobalDirty]);

    // API Calls
    const fetchYouTubeInfoFromBackend = async (url: string) => {
        try {
            const res = await fetch(`${API_URL}/api/youtube/scrape?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            return { name: data.name || "YouTube Channel", avatar: data.avatar || "https://cdn-icons-png.flaticon.com/512/1384/1384060.png" };
        } catch (error) { return { name: "YouTube Channel", avatar: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png" }; }
    };

    const handleAddChannel = async () => {
        if (!ytInputUrl.trim()) return Swal.fire({ title: 'เกิดข้อผิดพลาด', text: 'กรุณากรอกลิงก์หรือชื่อช่อง YouTube', icon: 'warning', background: '#0f172a', color: '#f1f5f9' });
        if (trackedChannels.length >= 10) return Swal.fire({ title: 'จำกัดจำนวน', text: 'เพิ่มช่องได้สูงสุด 10 ช่องเท่านั้น', icon: 'warning', background: '#0f172a', color: '#f1f5f9' });

        Swal.fire({ title: 'กำลังค้นหาช่อง...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });
        const ytInfo = await fetchYouTubeInfoFromBackend(ytInputUrl);
        Swal.close();

        const newChannel: TrackedChannel = { id: Date.now().toString(), ytChannelUrl: ytInputUrl, ytChannelName: ytInfo.name, ytChannelAvatar: ytInfo.avatar };
        setTrackedChannels(prev => [newChannel, ...prev]);
        setYtInputUrl("");
    };

    const deleteChannel = (id: string) => setTrackedChannels(prev => prev.filter(c => c.id !== id));

    const handleSaveAPI = async () => { 
        try {
            Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });
            const res = await fetch(`${API_URL}/api/guilds/${guildId}/notification/youtube`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings, channels: trackedChannels }),
                credentials: 'include'
            });
            if (res.ok) {
                Swal.fire({ title: 'บันทึกสำเร็จ!', text: 'ตั้งค่าการแจ้งเตือนเรียบร้อยแล้ว', icon: 'success', background: '#0f172a', color: '#f1f5f9', timer: 1500 }); 
                setInitialSettings(settings); setInitialChannels(trackedChannels); setIsDirty(false); 
            } else throw new Error("Failed to save data");
        } catch (e) { Swal.fire({ title: 'ข้อผิดพลาด!', text: 'ไม่สามารถบันทึกข้อมูลได้', icon: 'error', background: '#0f172a', color: '#f1f5f9' }); }
    };

    const handleResetAPI = () => { 
        if (initialSettings) setSettings(initialSettings); 
        if (initialChannels) setTrackedChannels(initialChannels); 
    };

    // 🔥 3. ปรับปรุงระบบแปลง Markdown ให้แม่นยำขึ้นแบบ Discord เด๊ะๆ
    const renderDiscordMarkdown = (text: string) => {
        // ขั้นตอนที่ 1: จัดการ HTML Entities ป้องกัน XSS
        let parsed = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // ขั้นตอนที่ 2: แทนที่ตัวแปร Custom Variables
        parsed = parsed
            .replace(/\{yt\.channel\}/g, 'Ch7HD News')
            .replace(/\{video\.title\}/g, previewType === 'live' ? 'ข่าวเด็ด 7 สี วันนี้' : 'สรุปข่าวเด่นประจำสัปดาห์')
            .replace(/\{video\.url\}/g, 'https://youtu.be/dQw4w9WgXcQ')
            .replace(/\{server\.name\}/g, 'Discord Server Name');

        // ขั้นตอนที่ 3: จัดการ Role Ping (CSS แบบ Discord)
        const pingHtml = settings.pingRoles.length > 0 
            ? settings.pingRoles.map(id => `<span class="bg-[#5865f2]/30 text-[#c9cdfb] hover:bg-[#5865f2] hover:text-white px-1 rounded font-medium cursor-pointer transition-colors duration-200">@${roles.find(r => r.id === id)?.name || 'Role'}</span>`).join(' ')
            : `<span class="bg-[#5865f2]/30 text-[#c9cdfb] hover:bg-[#5865f2] hover:text-white px-1 rounded font-medium cursor-pointer transition-colors duration-200">@Everyone</span>`;
        parsed = parsed.replace(/\{role\}/g, pingHtml);

        // ขั้นตอนที่ 4: แปลง Markdown ให้ตรงตามหลักของ Discord
        parsed = parsed
            // ตัวหนา **text**
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
            // ขีดเส้นใต้ __text__
            .replace(/__(.+?)__/g, '<u class="underline">$1</u>')
            // ตัวเอียง *text* หรือ _text_ (ทำหลังจาก ** และ __ แล้ว)
            .replace(/\*([^\*]+)\*/g, '<em class="italic">$1</em>')
            .replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
            // สไตรค์ทรู ~~text~~
            .replace(/~~(.+?)~~/g, '<s class="line-through text-white/60">$1</s>')
            // โค้ดบล็อก 1 บรรทัด `text`
            .replace(/`([^`]+)`/g, '<code class="bg-[#1e1f22] text-[#dbdee1] font-mono text-[14px] px-1.5 py-0.5 rounded">$1</code>')
            // แปลง URL ให้คลิกได้และมีสีฟ้า
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="text-[#00a8fc] hover:underline" target="_blank">$1</a>')
            // แปลงการขึ้นบรรทัดใหม่
            .replace(/\n/g, '<br/>');

        return <div dangerouslySetInnerHTML={{ __html: parsed }} className="text-[#dbdee1] leading-[1.375rem] text-[15px] whitespace-pre-wrap break-words" />;
    };

    return (
        <div className="flex flex-col pb-32 p-4 md:p-8 min-h-screen max-w-[1920px] mx-auto bg-background/50 font-sans">
            <div className="flex justify-between items-center mb-6 md:mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight drop-shadow-md flex items-center gap-3">
                        <Youtube className="w-8 h-8 md:w-10 md:h-10 text-red-500" /> YouTube Notifications
                    </h1>
                    <p className="text-secondary mt-1 md:mt-2 text-sm md:text-lg">เพิ่มช่องยูทูปและตั้งค่าการแจ้งเตือนทั้งหมดได้ในที่เดียว</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
                {/* ฝั่งซ้าย: จัดการรายชื่อช่อง */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-card backdrop-blur-md p-5 rounded-3xl border border-border shadow-xl">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4 border-b border-border/50 pb-3"><Layers className="w-5 h-5 text-red-500" /> จัดการช่อง ({trackedChannels.length}/10)</h2>
                        
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={ytInputUrl} onChange={(e) => setYtInputUrl(e.target.value)} placeholder="ลิงก์ช่อง (เช่น @Koyamie)" className="w-full bg-secondary/30 text-foreground px-3 py-2 rounded-xl border border-border focus:border-red-500 text-sm" />
                            <button onClick={handleAddChannel} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-xl shadow-md transition-all shrink-0 disabled:opacity-50" disabled={trackedChannels.length >= 10}><Plus className="w-5 h-5"/></button>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {trackedChannels.length === 0 ? (
                                <div className="text-center text-secondary/50 text-sm py-8 border-2 border-dashed border-border/50 rounded-xl">ยังไม่ได้เพิ่มช่อง YouTube</div>
                            ) : (
                                trackedChannels.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between bg-secondary/10 p-3 rounded-xl border border-border/50 hover:border-red-500/30 transition-all group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={sub.ytChannelAvatar} alt="Channel" className="w-9 h-9 rounded-full object-cover shrink-0 border border-border" />
                                            <a href={sub.ytChannelUrl.startsWith('http') ? sub.ytChannelUrl : `https://www.youtube.com/${sub.ytChannelUrl.startsWith('@') ? sub.ytChannelUrl : '@' + sub.ytChannelUrl}`} target="_blank" rel="noopener noreferrer" className="font-bold text-foreground text-sm truncate hover:text-red-400 hover:underline">{sub.ytChannelName || sub.ytChannelUrl}</a>
                                        </div>
                                        <button onClick={() => deleteChannel(sub.id)} className="p-1.5 text-secondary/50 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ฝั่งขวา: ตั้งค่าการแจ้งเตือน (Global) */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl">
                        
                        {/* 🔥 1. ย้ายปุ่ม คู่มือ มาไว้ตรงนี้ และปรับให้เด่นขึ้น */}
                        <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-3">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Bell className="w-5 h-5 text-red-500" /> ตั้งค่าการแจ้งเตือน (ใช้ร่วมกันทุกช่อง)</h2>
                            <button onClick={() => { setIsHelpModalMounted(true); setTimeout(() => setIsHelpModalVisible(true), 10); }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all font-bold shadow-sm active:scale-95">
                                <BookOpen className="w-3.5 h-3.5"/> คู่มือ & Markdown
                            </button>
                        </div>

                        {/* 1. Discord Target & Roles */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-20">
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2">ส่งแจ้งเตือนไปที่ห้อง <span className="text-red-500">*</span></label>
                                <ChannelSelect channels={channels} selectedChannelId={settings.targetChannelId} onChange={(id) => setSettings({...settings, targetChannelId: id})} />
                            </div>
                            <div className="relative z-10">
                                <label className="block text-secondary text-xs font-bold uppercase mb-2">ยศที่ต้องการ Ping</label>
                                <MultiRoleSelect roles={roles} selectedRoles={settings.pingRoles} onChange={(roles) => setSettings({...settings, pingRoles: roles})} />
                            </div>
                        </div>

                        {/* 2. Message Formats & Toggle */}
                        <div className="space-y-6 relative z-10">
                            {/* Video */}
                            <div className={`p-4 rounded-2xl border transition-all duration-300 ${settings.notifyVideos ? 'bg-secondary/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'bg-secondary/5 border-border/50'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={settings.notifyVideos} onChange={(e) => { setSettings({...settings, notifyVideos: e.target.checked}); if(e.target.checked) setPreviewType('video'); }} className="hidden" />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${settings.notifyVideos ? 'bg-red-500 border-red-500 text-white' : 'border-secondary/50 text-transparent group-hover:border-red-500'}`}><Check className="w-3.5 h-3.5" /></div>
                                        <span className={`font-bold ${settings.notifyVideos ? 'text-red-400' : 'text-secondary'}`}>แจ้งเตือนวิดีโอปกติ (Videos)</span>
                                    </label>
                                    {settings.notifyVideos && <button onClick={() => setPreviewType('video')} className={`text-xs px-2 py-1 rounded-md transition-all ${previewType === 'video' ? 'bg-red-500 text-white font-bold shadow-sm' : 'bg-secondary/20 text-secondary hover:text-white hover:bg-secondary/30'}`}>ดูพรีวิวแบบนี้</button>}
                                </div>
                                {settings.notifyVideos && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <SmartInput value={settings.videoMessage} onChange={(val) => setSettings({...settings, videoMessage: val})} placeholder="พิมพ์ข้อความสำหรับคลิปวิดีโอ..." />
                                    </div>
                                )}
                            </div>

                            {/* Shorts */}
                            <div className={`p-4 rounded-2xl border transition-all duration-300 ${settings.notifyShorts ? 'bg-secondary/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-secondary/5 border-border/50'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={settings.notifyShorts} onChange={(e) => { setSettings({...settings, notifyShorts: e.target.checked}); if(e.target.checked) setPreviewType('shorts'); }} className="hidden" />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${settings.notifyShorts ? 'bg-blue-500 border-blue-500 text-white' : 'border-secondary/50 text-transparent group-hover:border-blue-500'}`}><Check className="w-3.5 h-3.5" /></div>
                                        <span className={`font-bold ${settings.notifyShorts ? 'text-blue-400' : 'text-secondary'}`}>แจ้งเตือน Shorts</span>
                                    </label>
                                    {settings.notifyShorts && <button onClick={() => setPreviewType('shorts')} className={`text-xs px-2 py-1 rounded-md transition-all ${previewType === 'shorts' ? 'bg-blue-500 text-white font-bold shadow-sm' : 'bg-secondary/20 text-secondary hover:text-white hover:bg-secondary/30'}`}>ดูพรีวิวแบบนี้</button>}
                                </div>
                                {settings.notifyShorts && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <SmartInput value={settings.shortsMessage} onChange={(val) => setSettings({...settings, shortsMessage: val})} placeholder="พิมพ์ข้อความสำหรับ Shorts..." />
                                    </div>
                                )}
                            </div>

                            {/* Lives */}
                            <div className={`p-4 rounded-2xl border transition-all duration-300 ${settings.notifyLives ? 'bg-secondary/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-secondary/5 border-border/50'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={settings.notifyLives} onChange={(e) => { setSettings({...settings, notifyLives: e.target.checked}); if(e.target.checked) setPreviewType('live'); }} className="hidden" />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${settings.notifyLives ? 'bg-green-500 border-green-500 text-white' : 'border-secondary/50 text-transparent group-hover:border-green-500'}`}><Check className="w-3.5 h-3.5" /></div>
                                        <span className={`font-bold ${settings.notifyLives ? 'text-green-400' : 'text-secondary'}`}>แจ้งเตือนไลฟ์สด (Livestreams)</span>
                                    </label>
                                    {settings.notifyLives && <button onClick={() => setPreviewType('live')} className={`text-xs px-2 py-1 rounded-md transition-all ${previewType === 'live' ? 'bg-green-500 text-white font-bold shadow-sm' : 'bg-secondary/20 text-secondary hover:text-white hover:bg-secondary/30'}`}>ดูพรีวิวแบบนี้</button>}
                                </div>
                                {settings.notifyLives && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <SmartInput value={settings.liveMessage} onChange={(val) => setSettings({...settings, liveMessage: val})} placeholder="พิมพ์ข้อความสำหรับสตรีมสด..." />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Discord Mockup Preview */}
                        <div className="mt-8">
                            <label className="block text-secondary text-xs font-bold uppercase tracking-wide mb-3">ตัวอย่างการแสดงผลบนดิสคอร์ด</label>
                            
                            <div className="bg-[#313338] rounded-xl text-[#dbdee1] border border-[#1e1f22] overflow-hidden shadow-md font-sans">
                                {/* Message Context */}
                                <div className="px-4 pt-4 pb-4 hover:bg-[#2e3035] transition-colors relative group">
                                    <div className="flex items-start gap-4">
                                        <img src={botUser.avatar} className="w-10 h-10 rounded-full cursor-pointer hover:shadow-lg mt-0.5 object-cover bg-[#2b2d31]" alt="Bot" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-medium text-white text-[16px] hover:underline cursor-pointer">{botUser.name}</span>
                                                <span className="bg-[#5865f2] text-white text-[10px] px-1.5 py-[1px] rounded-[3px] font-bold flex items-center gap-1 shadow-sm"><Check className="w-2.5 h-2.5" /> BOT</span>
                                                <span className="text-[#949ba4] text-[12px] ml-1">วันนี้เวลา {currentTime} น.</span>
                                            </div>
                                            <div className="mt-1">
                                                {/* Render ข้อความที่ถูกเลือก Preview */}
                                                {previewType === 'video' && renderDiscordMarkdown(settings.videoMessage)}
                                                {previewType === 'shorts' && renderDiscordMarkdown(settings.shortsMessage)}
                                                {previewType === 'live' && renderDiscordMarkdown(settings.liveMessage)}
                                            </div>

                                            {/* จำลอง Native Embed ของ Discord */}
                                            <div className="mt-2 bg-[#2b2d31] border-l-[4px] border-[#ea3323] rounded flex flex-col max-w-[432px] overflow-hidden shadow-sm">
                                                <div className="p-3 pb-2 flex flex-col gap-1">
                                                    <div className="text-[12px] font-bold text-[#e8e8e8]">YouTube</div>
                                                    <div className="text-[16px] font-semibold text-[#00a8fc] hover:underline cursor-pointer leading-tight">
                                                        {previewType === 'live' ? 'ข่าวเด็ด 7 สี วันนี้' : 'สรุปข่าวเด่นประจำสัปดาห์'}
                                                    </div>
                                                </div>
                                                <div className="relative group/img cursor-pointer max-h-[240px] overflow-hidden">
                                                    <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&h=225&fit=crop" className="w-full h-auto object-cover" alt="Thumb" />
                                                    <div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <div className="bg-black/70 rounded-[12px] w-12 h-10 flex items-center justify-center backdrop-blur-sm"><Youtube className="w-6 h-6 text-white"/></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:ml-64 flex justify-center items-center transition-all duration-500 transform pointer-events-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-[70]`}>
                <div className={`pointer-events-auto bg-[#111214]/95 backdrop-blur-md border border-border p-3 md:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-500 ${shouldShake ? 'animate-shake-error' : ''}`}>
                    <span className="text-white font-medium flex items-center gap-2 pl-2 text-sm md:text-base"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button type="button" onClick={handleResetAPI} className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-secondary hover:text-foreground px-3 md:px-4 py-2 rounded-xl hover:bg-secondary/20 transition-all font-medium text-xs md:text-sm"><RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> รีเซ็ต</button>
                        <button type="submit" onClick={handleSaveAPI} className="flex-1 sm:flex-none justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs md:text-sm"><Save className="w-3 h-3 md:w-4 md:h-4" /> ยืนยันการตั้งค่า</button>
                    </div>
                </div>
            </div>

            {/* Help Modal */}
            {isHelpModalMounted && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isHelpModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={() => { setIsHelpModalVisible(false); setTimeout(() => setIsHelpModalMounted(false), 300); }}>
                    <div className={`bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden transition-all duration-300 ease-out transform ${isHelpModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`} onClick={e => e.stopPropagation()}>
                        <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-secondary/10 shrink-0">
                            <h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><span className="font-mono bg-secondary/20 px-2 py-1 rounded text-red-500 shadow-sm">{`{}`}</span> คู่มือ & Markdown</h3>
                            <button onClick={() => { setIsHelpModalVisible(false); setTimeout(() => setIsHelpModalMounted(false), 300); }} className="text-secondary hover:text-foreground hover:bg-secondary/20 p-1.5 rounded-lg transition-all"><X className="w-5 h-5"/></button>
                        </div>
                        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            <section>
                                <h4 className="text-foreground font-bold mb-3 flex items-center gap-2 text-sm"><Layers className="w-4 h-4 text-red-500" /> ตัวแปรที่ใช้ได้</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {YOUTUBE_VARS.map((v) => (
                                        <div key={v.name} className="bg-secondary/10 p-2 rounded-xl border border-border flex flex-col gap-1">
                                            <span className="font-mono text-foreground font-bold text-xs bg-secondary/20 px-2 py-0.5 rounded w-fit">{`{${v.name}}`}</span>
                                            <span className="text-secondary text-[10px]">{v.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section>
                                <h4 className="text-foreground font-bold mb-3 flex items-center gap-2 text-sm"><Type className="w-4 h-4 text-red-500" /> การจัดรูปแบบข้อความ (Discord Markdown)</h4>
                                <div className={`bg-secondary/10 rounded-xl border border-border overflow-x-auto hover:border-red-500/50 transition-all shadow-sm`}>
                                    <table className="w-full text-left text-sm min-w-[400px]">
                                        <thead className="bg-secondary/20 border-b border-border text-secondary">
                                            <tr><th className="p-3 font-semibold w-1/2">พิมพ์แบบนี้</th><th className="p-3 font-semibold w-1/2">ผลลัพธ์ที่ได้</th></tr>
                                        </thead>
                                        <tbody className="text-foreground divide-y divide-border">
                                            <tr className="hover:bg-secondary/20 transition-colors"><td className="p-3 font-mono">**ข้อความตัวหนา**</td><td className="p-3"><strong className="font-bold">ข้อความตัวหนา</strong></td></tr>
                                            <tr className="hover:bg-secondary/20 transition-colors"><td className="p-3 font-mono">*ข้อความตัวเอียง*</td><td className="p-3"><em className="italic">ข้อความตัวเอียง</em></td></tr>
                                            <tr className="hover:bg-secondary/20 transition-colors"><td className="p-3 font-mono">__ข้อความขีดเส้นใต้__</td><td className="p-3"><u className="underline">ข้อความขีดเส้นใต้</u></td></tr>
                                            <tr className="hover:bg-secondary/20 transition-colors"><td className="p-3 font-mono">~~ข้อความขีดฆ่า~~</td><td className="p-3"><s className="line-through text-white/60">ข้อความขีดฆ่า</s></td></tr>
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