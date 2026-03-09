"use client";

import { useEffect, useState, use } from "react";
import { 
    Save, 
    RotateCcw, 
    Hash, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    MessageSquare, 
    User, 
    Server, 
    Radio, 
    Mic, 
    Mail, 
    List, 
    Webhook, 
    PlayCircle,
    CheckSquare,
    Square,
    ShieldAlert,
    Split
} from "lucide-react";
import Swal from "sweetalert2";
import { useUnsavedChanges } from "@/components/providers/UnsavedChangesContext";

// --- Interfaces ---
interface LogSettings {
    log_channel_id: string | null;
    is_enabled: boolean;
    active_events: { [key: string]: boolean };
    ignored_channels: string[];
    ignored_roles: string[];
    use_event_channels: boolean;         // โหมดแยกช่อง
    event_channels: { [key: string]: string }; // เก็บ Channel ID ของแต่ละ Event
}

interface Channel {
    id: string;
    name: string;
    category?: string;
}

// --- Event Configuration ---
const availableEvents = [
    // Message Events
    { id: "message_delete", label: "Message Delete", category: "Message Events" },
    { id: "message_edit", label: "Message Edit", category: "Message Events" },
    { id: "message_bulk_delete", label: "Bulk Message Delete", category: "Message Events" },
    
    // Member Events
    { id: "member_join", label: "Member Join", category: "Member Events" },
    { id: "member_leave", label: "Member Leave", category: "Member Events" },
    { id: "member_update", label: "Member Update", category: "Member Events" },
    { id: "member_ban", label: "Member Ban", category: "Member Events" },
    { id: "member_unban", label: "Member Unban", category: "Member Events" },
    { id: "member_kick", label: "Member Kick", category: "Member Events" },

    // Server Events
    { id: "server_update", label: "Server Update", category: "Server Events" },
    { id: "emoji_update", label: "Emoji Update", category: "Server Events" },
    { id: "sticker_update", label: "Sticker Update", category: "Server Events" },
    { id: "role_create", label: "Role Create", category: "Server Events" },
    { id: "role_update", label: "Role Update", category: "Server Events" },
    { id: "role_delete", label: "Role Delete", category: "Server Events" },

    // Channel Events
    { id: "channel_create", label: "Channel Create", category: "Channel Events" },
    { id: "channel_update", label: "Channel Update", category: "Channel Events" },
    { id: "channel_delete", label: "Channel Delete", category: "Channel Events" },

    // Voice Events
    { id: "voice_join", label: "Voice Join", category: "Voice Events" },
    { id: "voice_leave", label: "Voice Leave", category: "Voice Events" },
    { id: "voice_move", label: "Voice Move", category: "Voice Events" },

    // Invite Events
    { id: "invite_create", label: "Invite Create", category: "Invite Events" },
    { id: "invite_delete", label: "Invite Delete", category: "Invite Events" },
    
    // Thread Events
    { id: "thread_create", label: "Thread Create", category: "Thread Events" },
    { id: "thread_delete", label: "Thread Delete", category: "Thread Events" },
    { id: "thread_update", label: "Thread Update", category: "Thread Events" },

    // Webhook Events
    { id: "webhook_update", label: "Webhook Update", category: "Webhook Events" },

     // Stage Events
    { id: "stage_create", label: "Stage Create", category: "Stage Events" },
    { id: "stage_update", label: "Stage Update", category: "Stage Events" },
    { id: "stage_delete", label: "Stage Delete", category: "Stage Events" },
];

const getCategoryIcon = (category: string) => {
    switch (category) {
        case "Message Events": return <MessageSquare className="w-5 h-5 text-blue-400" />;
        case "Member Events": return <User className="w-5 h-5 text-green-400" />;
        case "Server Events": return <Server className="w-5 h-5 text-purple-400" />;
        case "Channel Events": return <Radio className="w-5 h-5 text-orange-400" />;
        case "Voice Events": return <Mic className="w-5 h-5 text-pink-400" />;
        case "Invite Events": return <Mail className="w-5 h-5 text-yellow-400" />;
        case "Thread Events": return <List className="w-5 h-5 text-cyan-400" />;
        case "Webhook Events": return <Webhook className="w-5 h-5 text-red-400" />;
        case "Stage Events": return <PlayCircle className="w-5 h-5 text-indigo-400" />;
        default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
};

export default function LogsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: guildId } = use(params);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { setIsDirty: setGlobalDirty, shouldShake } = useUnsavedChanges();

    // State
    const [settings, setSettings] = useState<LogSettings>({
        log_channel_id: null,
        is_enabled: false,
        active_events: {},
        ignored_channels: [],
        ignored_roles: [],
        use_event_channels: false,
        event_channels: {}
    });
    const [initialSettings, setInitialSettings] = useState<LogSettings | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const categories = Array.from(new Set(availableEvents.map(e => e.category)));

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [channelsRes, settingsRes] = await Promise.all([
                    fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: "include" }),
                    fetch(`${API_URL}/api/logs/${guildId}`)
                ]);

                const channelsData = await channelsRes.json();
                if (channelsData.channels) setChannels(channelsData.channels);

                const settingsData = await settingsRes.json();
                setSettings(settingsData);
                setInitialSettings(settingsData);
            } catch (error) {
                console.error("Error fetching data:", error);
                Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [guildId, API_URL]);

    // Check Dirty State
    useEffect(() => {
        if (!initialSettings) return;
        const isChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        setIsDirty(isChanged);
        setGlobalDirty(isChanged); 
    }, [settings, initialSettings, setGlobalDirty]);

    // Handlers
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/logs/${guildId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setInitialSettings(settings);
                setIsDirty(false);
                setGlobalDirty(false);
                Swal.fire({
                    title: 'บันทึกสำเร็จ!',
                    icon: 'success',
                    background: '#0f172a',
                    color: '#f1f5f9',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            Swal.fire("Error", "เกิดข้อผิดพลาดในการบันทึก", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (initialSettings) setSettings(initialSettings);
    };

    // --- Logic for Simple Mode (Checkbox) ---
    const toggleEvent = (eventId: string) => {
        setSettings(prev => ({
            ...prev,
            active_events: {
                ...prev.active_events,
                [eventId]: !prev.active_events[eventId]
            }
        }));
    };

    const toggleAllEvents = (enable: boolean) => {
        setSettings(prev => {
            const newActiveEvents = { ...prev.active_events };
            availableEvents.forEach(e => {
                newActiveEvents[e.id] = enable;
            });
            return { ...prev, active_events: newActiveEvents };
        });
    };

    // --- Logic for Advanced Mode (Dropdown) ---
    const handleEventChannelChange = (eventId: string, channelId: string) => {
        setSettings(prev => ({
            ...prev,
            event_channels: {
                ...prev.event_channels,
                [eventId]: channelId
            }
        }));
    };

    if (isLoading) return <div className="p-10 text-center text-secondary animate-pulse flex flex-col items-center gap-4"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>Loading settings...</div>;

    return (
        <div className="flex flex-col pb-32 p-4 md:p-8 min-h-screen max-w-[1920px] mx-auto bg-background/50 font-sans">
            
            {/* Header + Big Toggle */}
            <div className="flex justify-between items-center mb-6 md:mb-10 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight drop-shadow-md">Server Logs</h1>
                    <p className="text-secondary mt-1 md:mt-2 text-sm md:text-lg">ติดตามและบันทึกทุกกิจกรรมภายในเซิร์ฟเวอร์</p>
                </div>
                {/* Big Toggle Switch (Master Switch) */}
                <label className="relative inline-flex items-center cursor-pointer scale-[1.1] md:scale-125 mr-2 md:mr-4 group">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.is_enabled} 
                        onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })} 
                    />
                    <div className="relative w-12 h-6 md:w-14 md:h-7 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(56,189,248,0.5)] group-hover:scale-105 transition-transform duration-300"></div>
                </label>
            </div>

            {/* Main Content Area */}
            <div className={`transition-all duration-300 ${!settings.is_enabled ? 'opacity-50 grayscale-[0.5] pointer-events-none' : ''}`}>
                
                {/* 1. Channel Settings (Main Log Channel) */}
                {/* ถ้าเปิดโหมดแยกช่อง ช่องนี้จะเป็น Default หรือถูกซ่อนก็ได้ แต่ปกติควรเก็บไว้เป็น fallback */}
                <div className={`relative z-[20] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border mb-6 md:mb-8 shadow-xl transition-all duration-300 animate-fade-in-up ${settings.use_event_channels ? 'opacity-50 pointer-events-none' : 'hover:shadow-primary/5'}`} style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-start">
                        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 border-b border-border/50 pb-3 flex items-center gap-2">
                            <Hash className="w-5 h-5 text-primary" /> ช่องสำหรับส่ง Log (Main Log Channel)
                        </h2>
                        {settings.use_event_channels && (
                            <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full border border-orange-400/20">
                                Disabled by "Select channel for each event"
                            </span>
                        )}
                    </div>
                    
                    <div className="max-w-xl">
                        <label className="block text-secondary text-xs font-bold uppercase mb-2 md:mb-4 tracking-wide">เลือกห้องหลัก (ใช้เมื่อไม่ได้แยกช่อง)</label>
                        <div className="relative">
                            <select 
                                value={settings.log_channel_id || ""}
                                onChange={(e) => setSettings({ ...settings, log_channel_id: e.target.value || null })}
                                className="w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 custom-scrollbar cursor-pointer text-sm"
                                disabled={settings.use_event_channels}
                            >
                                <option value="" className="bg-[#1e293b] text-white">-- ปิดการใช้งาน Logs (None) --</option>
                                {channels.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#1e293b] text-white">
                                        # {c.name} {c.category ? `| ${c.category}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Events Configuration */}
                <div className="relative z-[10] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border mb-6 md:mb-8 shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-col gap-4 mb-6 border-b border-border/50 pb-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" /> กำหนดค่า Events 
                            </h2>
                            
                            {/* Master Select All / Deselect All Buttons */}
                            {/* 🔥 ซ่อนปุ่มนี้เมื่อเปิดโหมดแยกช่อง */}
                            {!settings.use_event_channels && (
                                <div className="flex gap-2 animate-in fade-in">
                                    <button 
                                        onClick={() => toggleAllEvents(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold active:scale-95"
                                    >
                                        <CheckSquare className="w-4 h-4" /> Select All
                                    </button>
                                    <button 
                                        onClick={() => toggleAllEvents(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold active:scale-95"
                                    >
                                        <Square className="w-4 h-4" /> Deselect All
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 🔥 New Feature: Toggle Channel for Each Event */}
                        <div className="bg-secondary/10 p-4 rounded-xl border border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${settings.use_event_channels ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                                    <Split className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">เลือกช่องทางสำหรับแต่ละกิจกรรม</h3>
                                    <p className="text-xs text-secondary mt-0.5">ควรเลือกช่องทางสำหรับแต่ละกิจกรรม หรือใช้ช่องทางเดียวกันสำหรับทุกกิจกรรม</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-110">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={settings.use_event_channels} 
                                    onChange={(e) => setSettings({ ...settings, use_event_channels: e.target.checked })} 
                                />
                                <div className="w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary peer-checked:shadow-lg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {categories.map(category => (
                            <div key={category} className="bg-secondary/5 border border-border rounded-2xl p-5 hover:border-primary/30 transition-all hover:shadow-md">
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                                    {getCategoryIcon(category)}
                                    <h3 className="text-base font-bold text-foreground">{category}</h3>
                                </div>
                                <div className="space-y-1">
                                    {availableEvents.filter(e => e.category === category).map(event => (
                                        <div 
                                            key={event.id} 
                                            className={`flex items-center justify-between p-2 rounded-lg transition-colors group ${settings.use_event_channels ? '' : 'hover:bg-background/50 cursor-pointer'}`}
                                            onClick={() => !settings.use_event_channels && toggleEvent(event.id)}
                                        >
                                            <span className="text-sm text-secondary font-medium group-hover:text-foreground transition-colors flex-1">{event.label}</span>
                                            
                                            {/* 🔥 Logic การแสดงผล */}
                                            {settings.use_event_channels ? (
                                                // 🅰️ โหมดแยกช่อง: แสดง Dropdown
                                                <div className="w-32 sm:w-40" onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={settings.event_channels[event.id] || ""}
                                                        onChange={(e) => handleEventChannelChange(event.id, e.target.value)}
                                                        className={`w-full p-1.5 text-xs rounded-lg border focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer bg-background ${settings.event_channels[event.id] ? 'border-primary/50 text-primary font-medium' : 'border-border text-secondary/70'}`}
                                                    >
                                                        <option value="">Off (None)</option>
                                                        {channels.map(c => (
                                                            <option key={c.id} value={c.id} className="text-foreground">
                                                                # {c.name.substring(0, 15)}{c.name.length > 15 ? '...' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                // 🅱️ โหมดปกติ: แสดง Checkbox
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${settings.active_events[event.id] ? 'bg-primary border-primary scale-110' : 'border-border bg-background group-hover:border-primary/50'}`}>
                                                    {settings.active_events[event.id] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Ignored Channels (Future) */}
                <div className="relative z-[5] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl opacity-60 pointer-events-none animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 border-b border-border/50 pb-3 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-orange-500" /> Ignored Channels & Roles (Coming Soon)
                    </h2>
                    <p className="text-secondary text-sm">ส่วนนี้จะเปิดให้ใช้งานในการอัปเดตครั้งถัดไป</p>
                </div>

            </div>

            {/* Floating Action Bar (Sticky Bottom) */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:ml-64 flex justify-center items-center transition-all duration-500 transform pointer-events-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-[70]`}>
                <div className={`pointer-events-auto bg-[#111214]/95 backdrop-blur-md border border-border p-3 md:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-500 ${shouldShake ? 'animate-shake-error' : ''}`}>
                    <span className="text-white font-medium flex items-center gap-2 pl-2 text-sm md:text-base">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                    </span>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button 
                            type="button" 
                            onClick={handleReset} 
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-secondary hover:text-foreground px-3 md:px-4 py-2 rounded-xl hover:bg-secondary/20 transition-all duration-300 hover:scale-105 active:scale-95 font-medium text-xs md:text-sm bg-secondary/10 sm:bg-transparent"
                        >
                            <RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> Reset
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="flex-1 sm:flex-none justify-center bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center gap-2 text-xs md:text-sm"
                        >
                            {isSaving ? <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-3 h-3 md:w-4 md:h-4" />}
                            <span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง (Save)</span>
                            <span className="sm:hidden">บันทึก</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}