"use client";

import { useEffect, useState, use, useRef, memo, MouseEvent as ReactMouseEvent } from "react";
import { 
    Save, RotateCcw, Hash, CheckCircle2, FileText, MessageSquare, 
    User, Server, Radio, Shield, Smile, Blocks, Webhook, PlayCircle, 
    CheckSquare, Square, ShieldAlert, Split, Bot, Mic, Mail, List,
    Gavel, X, ChevronDown, Check
} from "lucide-react";
import Swal from "sweetalert2";
import { useUnsavedChanges } from "@/components/providers/UnsavedChangesContext";

interface LogSettings {
    log_channel_id: string | null;
    is_enabled: boolean;
    active_events: { [key: string]: boolean };
    ignored_channels: string[];
    ignored_roles: string[];
    use_event_channels: boolean;         
    event_channels: { [key: string]: string }; 
}

interface Channel { id: string; name: string; category?: string; }
interface Role { id: string; name: string; color?: string; }

const availableEvents = [
    { id: "track_bot_messages", label: "ติดตามข้อความของบอท", category: "กิจกรรมเกี่ยวกับข้อความ", isBeta: true },
    { id: "track_bot_embeds", label: "ติดตาม Embed ของบอท", category: "กิจกรรมเกี่ยวกับข้อความ", isBeta: true },
    { id: "message_delete", label: "ข้อความถูกลบ", category: "กิจกรรมเกี่ยวกับข้อความ" },
    { id: "message_edit", label: "ข้อความถูกแก้ไข", category: "กิจกรรมเกี่ยวกับข้อความ" },
    { id: "message_bulk_delete", label: "ลบข้อความจำนวนมาก", category: "กิจกรรมเกี่ยวกับข้อความ" },
    { id: "message_invite_track", label: "ติดตามลิงก์คำเชิญ", category: "กิจกรรมเกี่ยวกับข้อความ" },
    { id: "message_pinned", label: "ปักหมุดข้อความ", category: "กิจกรรมเกี่ยวกับข้อความ" },
    { id: "message_unpinned", label: "ยกเลิกปักหมุดข้อความ", category: "กิจกรรมเกี่ยวกับข้อความ" },
    { id: "member_join", label: "สมาชิกเข้าร่วม", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_leave", label: "สมาชิกออก", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_role_given", label: "ได้รับยศ", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_role_remove", label: "ถูกดึงยศออก", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_nickname_change", label: "เปลี่ยนชื่อเล่น", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_ban", label: "สมาชิกถูกแบน", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_unban", label: "ปลดแบนสมาชิก", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_kick", label: "สมาชิกถูกเตะ", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_prune", label: "คัดกรองสมาชิก (Prune)", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "member_timeout", label: "ระงับการใช้งาน (Timeout)", category: "กิจกรรมเกี่ยวกับสมาชิก" },
    { id: "server_update", label: "อัปเดตเซิร์ฟเวอร์", category: "กิจกรรมเกี่ยวกับเซิร์ฟเวอร์" },
    { id: "server_app_add", label: "เพิ่มแอปพลิเคชัน", category: "กิจกรรมเกี่ยวกับเซิร์ฟเวอร์" },
    { id: "server_event_create", label: "สร้างกิจกรรมเซิร์ฟเวอร์", category: "กิจกรรมเกี่ยวกับเซิร์ฟเวอร์" },
    { id: "server_event_update", label: "อัปเดตกิจกรรมเซิร์ฟเวอร์", category: "กิจกรรมเกี่ยวกับเซิร์ฟเวอร์" },
    { id: "server_event_delete", label: "ลบกิจกรรมเซิร์ฟเวอร์", category: "กิจกรรมเกี่ยวกับเซิร์ฟเวอร์" },
    { id: "channel_create", label: "สร้างช่อง", category: "กิจกรรมเกี่ยวกับช่อง" },
    { id: "channel_delete", label: "ลบช่อง", category: "กิจกรรมเกี่ยวกับช่อง" },
    { id: "channel_update", label: "อัปเดตช่อง", category: "กิจกรรมเกี่ยวกับช่อง" },
    { id: "channel_perm_create", label: "สร้างสิทธิ์การเข้าถึงช่อง", category: "กิจกรรมเกี่ยวกับช่อง" },
    { id: "channel_perm_update", label: "อัปเดตสิทธิ์การเข้าถึงช่อง", category: "กิจกรรมเกี่ยวกับช่อง" },
    { id: "channel_perm_delete", label: "ลบสิทธิ์การเข้าถึงช่อง", category: "กิจกรรมเกี่ยวกับช่อง" },
    { id: "role_create", label: "สร้างยศ", category: "กิจกรรมเกี่ยวกับยศ" },
    { id: "role_delete", label: "ลบยศ", category: "กิจกรรมเกี่ยวกับยศ" },
    { id: "role_update", label: "อัปเดตยศ", category: "กิจกรรมเกี่ยวกับยศ" },
    { id: "emoji_create", label: "สร้างอีโมจิ", category: "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์" },
    { id: "emoji_delete", label: "ลบอีโมจิ", category: "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์" },
    { id: "emoji_update", label: "อัปเดตอีโมจิ", category: "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์" },
    { id: "sticker_create", label: "สร้างสติกเกอร์", category: "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์" },
    { id: "sticker_delete", label: "ลบสติกเกอร์", category: "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์" },
    { id: "sticker_update", label: "อัปเดตสติกเกอร์", category: "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์" },
    { id: "voice_join", label: "เข้าร่วมช่องเสียง", category: "กิจกรรมเกี่ยวกับช่องเสียง" },
    { id: "voice_leave", label: "ออกจากช่องเสียง", category: "กิจกรรมเกี่ยวกับช่องเสียง" },
    { id: "voice_change", label: "ย้ายช่องเสียง", category: "กิจกรรมเกี่ยวกับช่องเสียง" },
    { id: "voice_disconnect", label: "ตัดการเชื่อมต่อช่องเสียง", category: "กิจกรรมเกี่ยวกับช่องเสียง" },
    { id: "voice_mute", label: "ปิดไมค์สมาชิก (Mute)", category: "กิจกรรมเกี่ยวกับช่องเสียง" },
    { id: "voice_deafen", label: "ห้ามฟังสมาชิก (Deafen)", category: "กิจกรรมเกี่ยวกับช่องเสียง" },
    { id: "thread_create", label: "สร้างเธรด", category: "กิจกรรมเกี่ยวกับเธรด (Thread)" },
    { id: "thread_delete", label: "ลบเธรด", category: "กิจกรรมเกี่ยวกับเธรด (Thread)" },
    { id: "thread_update", label: "อัปเดตเธรด", category: "กิจกรรมเกี่ยวกับเธรด (Thread)" },
    { id: "webhook_create", label: "สร้าง Webhook", category: "กิจกรรมเกี่ยวกับ Webhook" },
    { id: "webhook_update", label: "อัปเดต Webhook", category: "กิจกรรมเกี่ยวกับ Webhook" },
    { id: "webhook_delete", label: "ลบ Webhook", category: "กิจกรรมเกี่ยวกับ Webhook" },
    { id: "integration_create", label: "สร้าง Integration", category: "กิจกรรมเกี่ยวกับ Integration" },
    { id: "integration_update", label: "อัปเดต Integration", category: "กิจกรรมเกี่ยวกับ Integration" },
    { id: "integration_delete", label: "ลบ Integration", category: "กิจกรรมเกี่ยวกับ Integration" },
    { id: "invite_create", label: "สร้างคำเชิญ", category: "กิจกรรมเกี่ยวกับคำเชิญ" },
    { id: "invite_update", label: "อัปเดตคำเชิญ", category: "กิจกรรมเกี่ยวกับคำเชิญ" },
    { id: "invite_delete", label: "ลบคำเชิญ", category: "กิจกรรมเกี่ยวกับคำเชิญ" },
    { id: "stage_create", label: "สร้าง Stage", category: "กิจกรรมเกี่ยวกับ Stage" },
    { id: "stage_update", label: "อัปเดต Stage", category: "กิจกรรมเกี่ยวกับ Stage" },
    { id: "stage_delete", label: "ลบ Stage", category: "กิจกรรมเกี่ยวกับ Stage" },
    { id: "automod_rule_create", label: "สร้างกฎ AutoMod", category: "กิจกรรมเกี่ยวกับ AutoMod" },
    { id: "automod_rule_delete", label: "ลบกฎ AutoMod", category: "กิจกรรมเกี่ยวกับ AutoMod" },
    { id: "automod_rule_update", label: "อัปเดตกฎ AutoMod", category: "กิจกรรมเกี่ยวกับ AutoMod" },
    { id: "automod_block_message", label: "AutoMod บล็อกข้อความ", category: "กิจกรรมเกี่ยวกับ AutoMod" },
    { id: "automod_flag_message", label: "AutoMod ติดธงข้อความ", category: "กิจกรรมเกี่ยวกับ AutoMod" },
    { id: "automod_user_timeout", label: "AutoMod ระงับการใช้งาน", category: "กิจกรรมเกี่ยวกับ AutoMod" }
];

const modActions = [{ id: "mod_ban", label: "แบน" }, { id: "mod_kick", label: "เตะ" }, { id: "mod_mute", label: "ปิดไมค์เซิร์ฟเวอร์" }, { id: "mod_timeout", label: "ระงับการใช้งาน" }];
const modReversals = [{ id: "mod_unban", label: "ปลดแบน" }, { id: "mod_unmute", label: "เปิดไมค์เซิร์ฟเวอร์" }, { id: "mod_untimeout", label: "ยกเลิกระงับการใช้งาน" }];

const getCategoryIcon = (category: string) => {
    switch (category) {
        case "กิจกรรมเกี่ยวกับข้อความ": return <MessageSquare className="w-5 h-5 text-blue-400" />;
        case "กิจกรรมเกี่ยวกับสมาชิก": return <User className="w-5 h-5 text-green-400" />;
        case "กิจกรรมเกี่ยวกับเซิร์ฟเวอร์": return <Server className="w-5 h-5 text-purple-400" />;
        case "กิจกรรมเกี่ยวกับช่อง": return <Radio className="w-5 h-5 text-orange-400" />;
        case "กิจกรรมเกี่ยวกับยศ": return <Shield className="w-5 h-5 text-yellow-500" />;
        case "กิจกรรมเกี่ยวกับอีโมจิและสติกเกอร์": return <Smile className="w-5 h-5 text-emerald-400" />;
        case "กิจกรรมเกี่ยวกับช่องเสียง": return <Mic className="w-5 h-5 text-pink-400" />;
        case "กิจกรรมเกี่ยวกับเธรด (Thread)": return <List className="w-5 h-5 text-cyan-400" />;
        case "กิจกรรมเกี่ยวกับ Webhook": return <Webhook className="w-5 h-5 text-red-400" />;
        case "กิจกรรมเกี่ยวกับ Integration": return <Blocks className="w-5 h-5 text-blue-500" />;
        case "กิจกรรมเกี่ยวกับคำเชิญ": return <Mail className="w-5 h-5 text-yellow-400" />;
        case "กิจกรรมเกี่ยวกับ Stage": return <PlayCircle className="w-5 h-5 text-indigo-400" />;
        case "กิจกรรมเกี่ยวกับ AutoMod": return <Bot className="w-5 h-5 text-red-500" />;
        default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
};

// --- Component: CustomSelect (ขนาดเล็กสำหรับ Event ย่อย - โดนลืมใส่เมื่อกี้ 😅) ---
interface Option { value: string; label: React.ReactNode; style?: React.CSSProperties; }
interface CustomSelectProps { options: Option[]; value: string; onChange: (val: string) => void; placeholder?: string; icon?: React.ReactNode; }

const CustomSelect = memo(({ options, value, onChange, placeholder, icon }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div 
                className="min-h-[32px] w-full bg-secondary/30 text-foreground px-2.5 py-1.5 rounded-lg border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 cursor-pointer flex justify-between items-center text-xs"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="flex items-center gap-1.5 font-medium truncate" style={selectedOption?.style}>
                    {icon && icon}
                    {selectedOption ? selectedOption.label : (placeholder || "-- เลือก --")}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-secondary transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1.5 w-full min-w-[140px] bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-48 overflow-y-auto custom-scrollbar p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.map(option => {
                        const isSelected = value === option.value;
                        return (
                            <div 
                                key={option.value} 
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-foreground'}`}
                            >
                                <span className="text-xs font-medium flex items-center gap-2 truncate" style={option.style}>
                                    {option.label}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

// --- Component: ChannelSelect (เลือกห้องแชทหลัก) ---
interface ChannelSelectProps { channels: Channel[]; selectedChannelId: string; onChange: (channelId: string) => void; disabled?: boolean; placeholder?: string; }
const ChannelSelect = memo(({ channels, selectedChannelId, onChange, disabled = false, placeholder = "-- เลือกห้องดิสคอร์ด --" }: ChannelSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedChannel = channels.find(c => c.id === selectedChannelId);

    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div 
                className={`min-h-[46px] w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border transition-all duration-300 flex justify-between items-center text-sm ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {selectedChannel ? (
                    <span className="flex items-center gap-2 font-medium">
                        <Hash className="w-4 h-4 text-secondary/70" />
                        {selectedChannel.name} 
                        {selectedChannel.category && <span className="text-secondary/50 text-[11px] font-normal ml-1">| {selectedChannel.category}</span>}
                    </span>
                ) : (
                    <span className="text-secondary/50">{placeholder}</span>
                )}
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div 
                        onClick={() => { onChange(""); setIsOpen(false); }}
                        className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${!selectedChannelId ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-foreground'}`}
                    >
                        <span className="text-sm font-medium">ปิดการใช้งาน (ไม่เลือก)</span>
                    </div>
                    {channels.map(channel => {
                        const isSelected = selectedChannelId === channel.id;
                        return (
                            <div 
                                key={channel.id} 
                                onClick={() => { onChange(channel.id); setIsOpen(false); }}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-foreground'}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Hash className="w-4 h-4 text-secondary/70 shrink-0" />
                                    <span className="text-sm font-medium flex items-center flex-wrap gap-1">
                                        {channel.name}
                                        {channel.category && <span className="text-secondary/50 text-[11px] font-normal">| {channel.category}</span>}
                                    </span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                        );
                    })}
                    {channels.length === 0 && <div className="p-3 text-center text-secondary text-sm">ไม่พบห้องแชทในเซิร์ฟเวอร์</div>}
                </div>
            )}
        </div>
    );
});

// --- Component: MultiChannelSelect (สำหรับเลือกหลายห้องใน Ignored Channels) ---
interface MultiChannelSelectProps { channels: Channel[]; selectedChannels: string[]; onChange: (channels: string[]) => void; }
const MultiChannelSelect = memo(({ channels, selectedChannels, onChange }: MultiChannelSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleChannel = (channelId: string) => {
        if (selectedChannels.includes(channelId)) {
            onChange(selectedChannels.filter(id => id !== channelId));
        } else {
            onChange([...selectedChannels, channelId]);
        }
    };

    const removeChannel = (e: ReactMouseEvent, channelId: string) => {
        e.stopPropagation();
        onChange(selectedChannels.filter(id => id !== channelId));
    };

    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div 
                className="min-h-[46px] w-full bg-secondary/30 text-foreground p-2 rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    {selectedChannels.length === 0 && <span className="text-secondary/50 text-sm px-2">-- ค้นหาและเพิ่มห้องที่ต้องการละเว้น --</span>}
                    {selectedChannels.map(id => {
                        const channel = channels.find(c => c.id === id);
                        return (
                            <span key={id} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 bg-secondary/20 text-foreground px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:border-primary/50 transition-colors shadow-sm cursor-default group">
                                <Hash className="w-3.5 h-3.5 text-secondary/70" />
                                {channel?.name || id}
                                <button type="button" onClick={(e) => removeChannel(e, id)} className="text-secondary group-hover:text-red-500 ml-1 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                            </span>
                        );
                    })}
                </div>
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {channels.map(channel => {
                        const isSelected = selectedChannels.includes(channel.id);
                        return (
                            <div 
                                key={channel.id} 
                                onClick={() => toggleChannel(channel.id)}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-foreground'}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Hash className="w-4 h-4 text-secondary/70 shrink-0" />
                                    <span className="text-sm font-medium flex items-center flex-wrap gap-1">
                                        {channel.name}
                                        {channel.category && <span className="text-secondary/50 text-[11px] font-normal">| {channel.category}</span>}
                                    </span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                        );
                    })}
                    {channels.length === 0 && <div className="p-3 text-center text-secondary text-sm">ไม่พบห้องแชทในเซิร์ฟเวอร์</div>}
                </div>
            )}
        </div>
    );
});

// --- Component: MultiRoleSelect (เลือกยศแบบ Dropdown มีสี/Tag) ---
interface MultiRoleSelectProps { roles: Role[]; selectedRoles: string[]; onChange: (roles: string[]) => void; }
const MultiRoleSelect = memo(({ roles, selectedRoles, onChange }: MultiRoleSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleRole = (roleId: string) => {
        if (selectedRoles.includes(roleId)) {
            onChange(selectedRoles.filter(id => id !== roleId));
        } else {
            onChange([...selectedRoles, roleId]);
        }
    };

    const removeRole = (e: ReactMouseEvent, roleId: string) => {
        e.stopPropagation();
        onChange(selectedRoles.filter(id => id !== roleId));
    };

    return (
        <div className={`relative w-full ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
            <div 
                className="min-h-[46px] w-full bg-secondary/30 text-foreground p-2 rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-2 items-center flex-1">
                    {selectedRoles.length === 0 && <span className="text-secondary/50 text-sm px-2">-- ค้นหาและเพิ่มยศที่ต้องการละเว้น --</span>}
                    {selectedRoles.map(id => {
                        const role = roles.find(r => r.id === id);
                        if (!role) return null;
                        return (
                            <span key={id} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1 rounded-lg text-xs font-medium hover:border-primary/50 transition-colors shadow-sm cursor-default group">
                                {role.color && role.color !== '#000000' ? (
                                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: role.color }}></span>
                                ) : (
                                    <span className="text-secondary font-bold">@</span>
                                )}
                                {role.name}
                                <button type="button" onClick={(e) => removeRole(e, id)} className="text-secondary group-hover:text-red-500 ml-0.5 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
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
                            <div 
                                key={role.id} 
                                onClick={() => toggleRole(role.id)}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-foreground'}`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {role.color && role.color !== '#000000' ? (
                                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: role.color }}></span>
                                    ) : (
                                        <span className="text-secondary/70 font-bold bg-secondary/10 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">@</span>
                                    )}
                                    <span className="text-sm font-medium">{role.name}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-primary" />}
                            </div>
                        );
                    })}
                    {roles.length === 0 && <div className="p-3 text-center text-secondary text-sm">ไม่พบยศในเซิร์ฟเวอร์</div>}
                </div>
            )}
        </div>
    );
});


export default function LogsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: guildId } = use(params);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { setIsDirty: setGlobalDirty, shouldShake } = useUnsavedChanges();

    const [settings, setSettings] = useState<LogSettings>({
        log_channel_id: null, is_enabled: false, active_events: {},
        ignored_channels: [], ignored_roles: [], use_event_channels: false, event_channels: {}
    });
    const [initialSettings, setInitialSettings] = useState<LogSettings | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const categories = Array.from(new Set(availableEvents.map(e => e.category)));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [channelsRes, settingsRes] = await Promise.all([
                    fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: "include" }),
                    fetch(`${API_URL}/api/logs/${guildId}`, { credentials: "include" })
                ]);
                const channelsData = await channelsRes.json();
                if (channelsData.channels) setChannels(channelsData.channels);
                if (channelsData.roles) setRoles(channelsData.roles); 

                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(settingsData);
                    setInitialSettings(settingsData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally { 
                setIsLoading(false); 
            }
        };
        fetchData();
    }, [guildId, API_URL]);

    useEffect(() => {
        if (!initialSettings) return;
        const isChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        setIsDirty(isChanged);
        setGlobalDirty(isChanged); 
    }, [settings, initialSettings, setGlobalDirty]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/logs/${guildId}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
                credentials: "include"
            });
            if (res.ok) {
                setInitialSettings(settings); setIsDirty(false); setGlobalDirty(false);
                Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', background: '#0f172a', color: '#f1f5f9', timer: 1500, showConfirmButton: false });
            } else throw new Error("Failed to save");
        } catch (error) { Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกการตั้งค่าได้", "error"); } 
        finally { setIsSaving(false); }
    };

    const handleReset = () => { if (initialSettings) setSettings(initialSettings); };

    const toggleEvent = (eventId: string) => {
        setSettings(prev => ({ ...prev, active_events: { ...prev.active_events, [eventId]: !prev.active_events[eventId] } }));
    };

    const updateActiveEvent = (eventId: string, value: boolean) => {
        setSettings(prev => ({ ...prev, active_events: { ...prev.active_events, [eventId]: value } }));
    };

    const toggleAllEvents = (enable: boolean) => {
        setSettings(prev => {
            const newActiveEvents = { ...prev.active_events };
            availableEvents.forEach(e => { newActiveEvents[e.id] = enable; });
            return { ...prev, active_events: newActiveEvents };
        });
    };

    const handleEventChannelChange = (eventId: string, channelId: string) => {
        setSettings(prev => ({ ...prev, event_channels: { ...prev.event_channels, [eventId]: channelId } }));
    };

    if (isLoading) return <div className="p-10 text-center text-secondary animate-pulse flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>กำลังโหลดข้อมูล...</div>;

    return (
        <div className="flex flex-col pb-32 p-4 md:p-8 min-h-screen max-w-[1920px] mx-auto bg-background/50 font-sans">
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes zoomInFade {
                    0% { opacity: 0; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-up {
                    opacity: 0;
                    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-zoom-in {
                    opacity: 0;
                    animation: zoomInFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}} />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 md:mb-10 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight drop-shadow-md">ระบบบันทึกเหตุการณ์</h1>
                    <p className="text-secondary mt-1 md:mt-2 text-sm md:text-lg">ติดตามและบันทึกทุกกิจกรรมภายในเซิร์ฟเวอร์</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-[1.1] md:scale-125 mr-2 md:mr-4 group">
                    <input type="checkbox" className="sr-only peer" checked={settings.is_enabled} onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })} />
                    <div className="relative w-12 h-6 md:w-14 md:h-7 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all transition-transform duration-300"></div>
                </label>
            </div>

            {/* 🔥 กล่องคลุมสำหรับทำ Dim Animation */}
            <div className={`flex flex-col transition-all duration-500 ease-in-out ${!settings.is_enabled ? 'opacity-50 pointer-events-none select-none grayscale-[20%]' : 'opacity-100 grayscale-0'}`}>
                
                {/* 1. Main Channel Select */}
                <div className={`relative z-[40] bg-card backdrop-blur-md rounded-3xl border border-border shadow-xl mb-6 p-5 md:p-8 animate-fade-in-up ${settings.use_event_channels ? 'opacity-50 pointer-events-none' : ''}`} style={{ animationDelay: '150ms' }}>
                    <div className="flex justify-between items-start mb-4 md:mb-6 border-b border-border/50 pb-3">
                        <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                            <Hash className="w-5 h-5 text-primary" /> ช่องหลัก (Main Channel)
                        </h2>
                        {settings.use_event_channels && <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full">ถูกปิดเนื่องจากเปิด "เลือกช่องแยกตามกิจกรรม"</span>}
                    </div>
                    <div className="max-w-xl">
                        <label className="block text-secondary text-xs font-bold uppercase mb-2 tracking-wide">เลือกห้องหลัก (สำหรับเหตุการณ์ที่ไม่ได้แยกช่อง)</label>
                        {/* 🔥 นำ ChannelSelect มาใช้ */}
                        <ChannelSelect 
                            channels={channels} 
                            selectedChannelId={settings.log_channel_id || ""} 
                            onChange={(id) => setSettings({ ...settings, log_channel_id: id || null })} 
                            disabled={settings.use_event_channels}
                            placeholder="-- ปิดการใช้งาน (ไม่เลือก) --"
                        />
                    </div>
                </div>

                {/* 2. Standard Events Grid */}
                <div className="relative z-[30] bg-card backdrop-blur-md rounded-3xl border border-border shadow-xl mb-6 p-5 md:p-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-border/50 pb-4">
                        <div className="flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> กำหนดค่าเหตุการณ์ (Events)</h2>
                            <p className="text-secondary text-xs md:text-sm mt-1">เลือกกิจกรรมที่ต้องการให้บอทแจ้งเตือนใน Log</p>
                        </div>
                        
                        <div className={`flex gap-2 transition-all duration-500 ease-in-out origin-right ${!settings.use_event_channels ? 'opacity-100 scale-100 translate-x-0 w-auto' : 'opacity-0 scale-95 translate-x-4 w-0 overflow-hidden pointer-events-none'}`}>
                            <button onClick={() => toggleAllEvents(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold whitespace-nowrap"><CheckSquare className="w-4 h-4" /> เลือกทั้งหมด</button>
                            <button onClick={() => toggleAllEvents(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold whitespace-nowrap"><Square className="w-4 h-4" /> ยกเลิกทั้งหมด</button>
                        </div>
                    </div>
                    
                    <div className="bg-secondary/10 p-4 rounded-xl border border-border flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors duration-300 ${settings.use_event_channels ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}><Split className="w-5 h-5" /></div>
                            <div><h3 className="text-sm font-bold text-foreground">เลือกช่องทางแยกตามกิจกรรม</h3><p className="text-xs text-secondary mt-0.5">เปิดเพื่อระบุช่องส่ง Log แบบแยกตามประเภทกิจกรรม</p></div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer scale-110">
                            <input type="checkbox" className="sr-only peer" checked={settings.use_event_channels} onChange={(e) => setSettings({ ...settings, use_event_channels: e.target.checked })} />
                            <div className="w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* 🔥 เพิ่ม Z-index ย้อนกลับให้การ์ดหมวดหมู่ เพื่อไม่ให้ Dropdown ของแถวบนโดนแถวล่างทับ */}
                        {categories.map((category, index) => (
                            <div key={category} className="relative bg-secondary/5 border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors animate-zoom-in" style={{ zIndex: 50 - index, animationDelay: `${400 + (index * 50)}ms` }}>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                                    {getCategoryIcon(category)}<h3 className="text-base font-bold text-foreground">{category}</h3>
                                </div>
                                <div className="space-y-1 relative">
                                    {/* 🔥 เพิ่ม Z-index ย้อนกลับให้ Event Row ย่อย */}
                                    {availableEvents.filter(e => e.category === category).map((event, eventIdx) => (
                                        <div key={event.id} className={`relative flex items-center justify-between p-2 rounded-lg transition-colors group ${settings.use_event_channels ? 'overflow-visible' : 'hover:bg-background/50 cursor-pointer'}`} style={{ zIndex: 50 - eventIdx }} onClick={() => !settings.use_event_channels && toggleEvent(event.id)}>
                                            <span className="text-sm text-secondary font-medium group-hover:text-foreground transition-colors flex-1 flex items-center truncate pr-2">
                                                <span className="truncate">{event.label}</span>
                                                {event.isBeta && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/50 uppercase flex-shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.2)]">Beta</span>}
                                            </span>
                                            
                                            <div className={`relative flex items-center justify-end h-8 transition-all duration-500 ease-in-out ${settings.use_event_channels ? 'w-32 sm:w-40' : 'w-5'}`}>
                                                {/* 🔥 นำ CustomSelect ขนาดเล็กมาใช้สำหรับ Event ย่อย */}
                                                <div className={`absolute right-0 w-32 sm:w-40 origin-right transition-all duration-500 ease-in-out ${settings.use_event_channels ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-4 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
                                                    <CustomSelect 
                                                        value={settings.event_channels[event.id] || ""} 
                                                        onChange={(val) => handleEventChannelChange(event.id, val)} 
                                                        placeholder="ปิด (ไม่ส่ง)"
                                                        options={[
                                                            { value: "", label: "ปิด (ไม่ส่ง)" },
                                                            ...channels.map(c => ({ 
                                                                value: c.id, 
                                                                label: `# ${c.name.substring(0, 15)}${c.name.length > 15 ? '...' : ''}` 
                                                            }))
                                                        ]}
                                                    />
                                                </div>
                                                
                                                {/* Checkbox */}
                                                <div className={`absolute right-0 flex items-center justify-center origin-center transition-all duration-500 ease-in-out ${!settings.use_event_channels ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-50 -translate-x-4 pointer-events-none'}`}>
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors duration-300 ${settings.active_events[event.id] ? 'bg-primary border-primary' : 'border-border bg-background group-hover:border-primary/50'}`}>
                                                        {settings.active_events[event.id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Ignored Channels */}
                <div className="relative z-[20] bg-card backdrop-blur-md rounded-3xl border border-border shadow-xl mb-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                    <div className="p-5 md:p-6 flex justify-between items-center bg-secondary/5 rounded-t-3xl">
                        <div className="flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><Hash className="w-5 h-5 text-orange-400" /> ช่องที่ต้องการละเว้น (Ignored Channels)</h2>
                            <p className="text-secondary text-xs md:text-sm mt-1">ตั้งค่าช่องที่ไม่ต้องการให้ส่ง Logs (เหตุการณ์ในช่องเหล่านี้จะไม่ถูกบันทึก)</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input type="checkbox" className="sr-only peer" checked={!!settings.active_events["_ignored_channels_enabled"]} onChange={(e) => updateActiveEvent("_ignored_channels_enabled", e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                            <ChevronDown className={`text-secondary w-5 h-5 transition-transform duration-300 ${settings.active_events["_ignored_channels_enabled"] ? "rotate-180" : ""}`} />
                        </div>
                    </div>
                    {/* 🔥 แก้ไข overflow-hidden เพื่อไม่ให้กล่อง dropdown โดนตัดขอบ */}
                    <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${settings.active_events["_ignored_channels_enabled"] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className={settings.active_events["_ignored_channels_enabled"] ? "overflow-visible" : "overflow-hidden"}>
                            <div className="p-5 md:p-8 border-t border-border/50">
                                <div className="max-w-2xl">
                                    <label className="block text-secondary text-xs font-bold tracking-wide uppercase mb-3">ค้นหาและเพิ่มช่องที่ต้องการละเว้น</label>
                                    <MultiChannelSelect 
                                        channels={channels} 
                                        selectedChannels={settings.ignored_channels} 
                                        onChange={(newChannels) => setSettings(s => ({ ...s, ignored_channels: newChannels }))} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Ignored Roles */}
                <div className="relative z-[15] bg-card backdrop-blur-md rounded-3xl border border-border shadow-xl mb-6 animate-fade-in-up" style={{ animationDelay: '750ms' }}>
                    <div className="p-5 md:p-6 flex justify-between items-center bg-secondary/5 rounded-t-3xl">
                        <div className="flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-yellow-500" /> ยศที่ต้องการละเว้น (Ignored Roles)</h2>
                            <p className="text-secondary text-xs md:text-sm mt-1">ตั้งค่ายศที่ไม่ต้องการให้ส่ง Logs (การกระทำของสมาชิกที่มียศเหล่านี้จะไม่ถูกบันทึก)</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input type="checkbox" className="sr-only peer" checked={!!settings.active_events["_ignored_roles_enabled"]} onChange={(e) => updateActiveEvent("_ignored_roles_enabled", e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                            <ChevronDown className={`text-secondary w-5 h-5 transition-transform duration-300 ${settings.active_events["_ignored_roles_enabled"] ? "rotate-180" : ""}`} />
                        </div>
                    </div>
                    {/* 🔥 แก้ไข overflow-hidden เพื่อไม่ให้กล่อง dropdown โดนตัดขอบ */}
                    <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${settings.active_events["_ignored_roles_enabled"] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className={settings.active_events["_ignored_roles_enabled"] ? "overflow-visible" : "overflow-hidden"}>
                            <div className="p-5 md:p-8 border-t border-border/50">
                                <div className="max-w-2xl">
                                    <label className="block text-secondary text-xs font-bold tracking-wide uppercase mb-3">ค้นหาและเพิ่มยศที่ต้องการละเว้น</label>
                                    <MultiRoleSelect 
                                        roles={roles} 
                                        selectedRoles={settings.ignored_roles} 
                                        onChange={(newRoles) => setSettings(s => ({ ...s, ignored_roles: newRoles }))} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Moderation Logs */}
                <div className="relative z-[10] bg-[#1e293b]/70 backdrop-blur-md rounded-3xl border border-[#334155] shadow-xl mb-8 animate-fade-in-up" style={{ animationDelay: '900ms' }}>
                    <div className="p-5 md:p-6 flex justify-between items-center rounded-t-3xl">
                        <div className="flex-1">
                            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Gavel className="w-5 h-5 text-red-400" /> ประวัติการจัดการ (Moderation Logs)</h2>
                            <p className="text-gray-300 text-xs md:text-sm mt-1">กำหนดค่าการส่ง Log สำหรับการกระทำของแอดมินโดยเฉพาะ (เช่น แบน, เตะ, ปิดไมค์)</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input type="checkbox" className="sr-only peer" checked={!!settings.active_events["_mod_logs_enabled"]} onChange={(e) => updateActiveEvent("_mod_logs_enabled", e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                            <ChevronDown className={`text-gray-300 w-5 h-5 transition-transform duration-300 ${settings.active_events["_mod_logs_enabled"] ? "rotate-180" : ""}`} />
                        </div>
                    </div>
                    {/* 🔥 แก้ไข overflow-hidden เพื่อไม่ให้กล่อง dropdown โดนตัดขอบ */}
                    <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${settings.active_events["_mod_logs_enabled"] ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className={settings.active_events["_mod_logs_enabled"] ? "overflow-visible" : "overflow-hidden"}>
                            <div className="p-5 md:p-8 border-t border-[#334155] bg-[#0f172a]/50 rounded-b-3xl">
                                <div className="mb-8 max-w-xl relative z-20">
                                    <label className="block text-gray-300 text-xs font-bold tracking-wide uppercase mb-2">ช่องบันทึกประวัติการจัดการ</label>
                                    <p className="text-gray-400 text-[10px] mb-3">เลือกห้องที่ต้องการให้บันทึกประวัติการกระทำของแอดมิน</p>
                                    <ChannelSelect 
                                        channels={channels} 
                                        selectedChannelId={settings.event_channels["_mod_log_channel"] || ""} 
                                        onChange={(id) => handleEventChannelChange("_mod_log_channel", id)} 
                                        placeholder="-- ไม่เลือก (ปิด) --"
                                    />
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <h3 className="text-gray-300 text-xs font-bold tracking-wide uppercase mb-3">การจัดการสมาชิก (Moderation Actions)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {modActions.map(action => (
                                                <div key={action.id} onClick={() => toggleEvent(action.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${settings.active_events[action.id] ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>
                                                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${settings.active_events[action.id] ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                                        {settings.active_events[action.id] && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-sm font-medium">{action.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-gray-300 text-xs font-bold tracking-wide uppercase mb-3">การยกเลิกการจัดการ (Reversal Actions)</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {modReversals.map(action => (
                                                <div key={action.id} onClick={() => toggleEvent(action.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${settings.active_events[action.id] ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>
                                                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${settings.active_events[action.id] ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                                                        {settings.active_events[action.id] && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-sm font-medium">{action.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div> {/* <-- จบ Wrapper สำหรับ Dim */}

            {/* Floating Action Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:ml-64 flex justify-center items-center transition-all duration-500 transform pointer-events-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-[200]`}>
                <div className={`pointer-events-auto bg-[#111214]/95 backdrop-blur-md border border-border p-3 md:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-500 ${shouldShake ? 'animate-shake-error' : ''}`}>
                    <span className="text-white font-medium flex items-center gap-2 pl-2 text-sm md:text-base"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button type="button" onClick={handleReset} className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-secondary hover:text-foreground px-3 md:px-4 py-2 rounded-xl hover:bg-secondary/20 transition-all font-medium text-xs md:text-sm bg-secondary/10 sm:bg-transparent"><RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> Reset</button>
                        <button type="button" onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none justify-center bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2 text-xs md:text-sm">{isSaving ? <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-3 h-3 md:w-4 md:h-4" />}<span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง</span><span className="sm:hidden">บันทึก</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
}