"use client";

import { useEffect, useState, useRef, ChangeEvent, MouseEvent as ReactMouseEvent, FormEvent, memo } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Save, RotateCcw, Layout, ShieldAlert, Gavel, Type, Layers, BookOpen, Link as LinkIcon, Clock, Plus, Trash2, Columns, Eye, BellRing, ShieldOff, Lightbulb, Send, Hash, Check, ChevronDown } from 'lucide-react';
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesContext';

// --- Interfaces & Constants ---
interface UserProfile { username: string; global_name: string; id: string; avatar: string; error?: string; }
interface GuildProfile { name: string; id: string; icon: string; approximate_member_count?: number; member_count?: number; }
interface Channel { id: string; name: string; category?: string; }
interface Role { id: string; name: string; color?: string; }
interface BotInfo { name: string; avatar: string; }
interface EmbedField { id: string; name: string; value: string; inline: boolean; }
interface EmbedData { author_name: string; author_icon: string; title: string; description: string; url: string; color: string; thumbnail: string; image: string; footer_text: string; footer_icon: string; timestamp_mode: 'none' | 'current' | 'custom'; custom_timestamp: string; fields?: EmbedField[]; }
interface SmartInputProps { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; wrapperClassName?: string; isTextarea?: boolean; maxLength?: number; showCounter?: boolean; }
interface ImageInputProps { label: string; value: string; onChange: (value: string) => void; botAvatar: string; userReal: UserProfile | null; guildReal: GuildProfile | null; }

interface AntiSpamSettings { 
    isEnabled: boolean; 
    selectedChannel: string; 
    message: string;
    useEmbed: boolean;
    embedData: EmbedData; 
    spamWords: string[]; 
    punishment: "kick" | "ban" | "timeout"; 
    timeoutDays: number | "custom"; 
    customTimeout: number; 
    
    // --- New Settings ---
    isLogEnabled: boolean;
    logChannelId: string;
    isIgnoreChannelsEnabled: boolean;
    ignoredChannels: string[];
    isIgnoreRolesEnabled: boolean;
    ignoredRoles: string[];
}

const AVAILABLE_VARS = [
    { name: "user", desc: "แท็กผู้ใช้ (@GlobalName)" }, { name: "user.username", desc: "ชื่อผู้ใช้จริง (Username)" }, { name: "user.global_name", desc: "ชื่อที่แสดง (Global Name)" },
    { name: "user.id", desc: "ไอดีผู้ใช้" }, { name: "user.avatar", desc: "ลิงก์รูปโปรไฟล์" }, { name: "server.name", desc: "ชื่อเซิร์ฟเวอร์" },
    { name: "server.id", desc: "ไอดีเซิร์ฟเวอร์" }, { name: "server.icon", desc: "ลิงก์ไอคอนเซิร์ฟเวอร์" }, { name: "membercount", desc: "จำนวนสมาชิก" },
    { name: "membercount.ordinal", desc: "ลำดับสมาชิก (ex. 17th)" }, { name: "#channel_name", desc: "แท็กห้อง" },
    { name: "@role_name", desc: "แท็กยศ" }, { name: ":emoji_name", desc: "ใส่อิโมจิ" }
];

const DebouncedColorInput = memo(({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
    const [localColor, setLocalColor] = useState(value);
    useEffect(() => { setLocalColor(value); }, [value]);
    useEffect(() => {
        const timer = setTimeout(() => { if (localColor !== value) onChange(localColor); }, 150);
        return () => clearTimeout(timer);
    }, [localColor, value, onChange]);
    return <input type="color" value={localColor} onChange={(e) => setLocalColor(e.target.value)} className={className} />;
});

const SmartInput = memo(({ value, onChange, placeholder, className, wrapperClassName, isTextarea = false, maxLength, showCounter = true }: SmartInputProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value; onChange(val);
        const cursor = e.target.selectionStart; if (cursor === null) return;
        const textBeforeCursor = val.slice(0, cursor); const match = textBeforeCursor.match(/\{([a-zA-Z0-9._@#:]*)$/);
        if (match) { setShowMenu(true); setFilter(match[1].toLowerCase()); } else { setShowMenu(false); }
    };

    const insertVar = (varName: string) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart; if (cursor === null) return;
        const textBeforeCursor = value.slice(0, cursor); const textAfterCursor = value.slice(cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z0-9._@#:]*)$/);
        if (match) {
            const startPos = cursor - match[1].length - 1; const newText = value.slice(0, startPos) + `{${varName}}` + textAfterCursor;
            if (maxLength && newText.length > maxLength) return;
            onChange(newText); setShowMenu(false);
            setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); const newCursorPos = startPos + varName.length + 2; inputRef.current.setSelectionRange(newCursorPos, newCursorPos); } }, 0);
        }
    };

    const inputClasses = `w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder:text-secondary/50 text-sm ${className || ""}`;

    return (
        <div className={`relative w-full ${wrapperClassName || ""}`}>
            {showCounter && maxLength && (<div className={`absolute -top-5 right-0 text-[10px] font-mono select-none pointer-events-none transition-colors duration-150 ${value.length >= maxLength ? 'text-red-400 font-bold' : 'text-secondary'}`}>{value.length}/{maxLength}</div>)}
            {isTextarea ? (
                <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={value} onChange={handleChange} className={`${inputClasses} custom-scrollbar`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            ) : (
                <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" value={value} onChange={handleChange} className={inputClasses} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            )}
            {showMenu && (
                <div className="absolute z-50 bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] mt-2 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar animate-in fade-in zoom-in-95 duration-200" style={{ top: '100%', left: 0 }}>
                    {AVAILABLE_VARS.filter(v => v.name.toLowerCase().includes(filter)).map(v => (
                        <div key={v.name} onMouseDown={(e: ReactMouseEvent<HTMLDivElement>) => { e.preventDefault(); insertVar(v.name); }} className="px-3 py-2 hover:bg-primary/20 cursor-pointer flex justify-between items-center transition-colors border-b border-border/50 last:border-0"><span className="font-bold text-primary font-mono text-xs">{`{${v.name}}`}</span><span className="text-secondary text-[10px]">{v.desc}</span></div>
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Component: CustomSelect ---
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
                className="min-h-[46px] w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 cursor-pointer flex justify-between items-center text-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="flex items-center gap-2 font-medium" style={selectedOption?.style}>
                    {icon && icon}
                    {selectedOption ? selectedOption.label : (placeholder || "-- เลือก --")}
                </span>
                <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#111214]/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-56 overflow-y-auto custom-scrollbar p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.map(option => {
                        const isSelected = value === option.value;
                        return (
                            <div 
                                key={option.value} 
                                onClick={() => { onChange(option.value); setIsOpen(false); }}
                                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-foreground'}`}
                            >
                                <span className="text-sm font-medium flex items-center gap-2" style={option.style}>
                                    {option.label}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

// --- Component: ChannelSelect ---
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
                        <span className="text-sm font-medium">-- ไม่เลือก --</span>
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

// --- Component: MultiChannelSelect ---
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

// --- Component: MultiRoleSelect ---
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

const parseMarkdown = (text: string) => {
    if (!text) return null;
    const regex = /(\[[^\]]+\]\([^)]+\)|\*\*(?:.*?)\*\*|__(?:.*?)__|~~(?:.*?)~~|\*(?:.*?)\*|_(?:.*?)_|`(?:.*?)`|<@[^>]+>|<#[^>]+>|:[a-zA-Z0-9_]+:)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
        if (!part) return null;
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/); if (linkMatch) return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline cursor-pointer break-words transition-colors duration-200">{linkMatch[1]}</a>;
        const boldMatch = part.match(/^\*\*(.*?)\*\*$/); if (boldMatch) return <strong key={index} className="font-bold text-white">{boldMatch[1]}</strong>;
        const underlineMatch = part.match(/^__(.*?)__$/); if (underlineMatch) return <u key={index} className="underline">{underlineMatch[1]}</u>;
        const strikeMatch = part.match(/^~~(.*?)~~$/); if (strikeMatch) return <s key={index} className="line-through opacity-70">{strikeMatch[1]}</s>;
        const italicMatch = part.match(/^\*(.*?)\*$/) || part.match(/^_(.*?)_$/); if (italicMatch) return <em key={index} className="italic text-inherit">{italicMatch[1]}</em>;
        const codeMatch = part.match(/^`(.*?)`$/); if (codeMatch) return <code key={index} className="bg-secondary/30 text-foreground px-1.5 py-0.5 rounded text-[13px] font-mono border border-border">{codeMatch[1]}</code>;
        const mentionMatch = part.match(/^<@([^>]+)>$/); if (mentionMatch) return <span key={index} className="bg-primary/20 text-primary px-[4px] py-[1px] mx-[2px] rounded font-medium inline-block break-words cursor-pointer hover:bg-primary hover:text-white transition-colors duration-200">@{mentionMatch[1]}</span>;
        const channelMatch = part.match(/^<#([^>]+)>$/); if (channelMatch) return <span key={index} className="bg-primary/20 text-primary px-[4px] py-[1px] mx-[2px] rounded font-medium inline-block break-words cursor-pointer hover:bg-primary hover:text-white transition-colors duration-200">#{channelMatch[1]}</span>;
        const emojiMatch = part.match(/^:([a-zA-Z0-9_]+):$/); 
        if (emojiMatch) {
            const isNum = /^\d+$/.test(emojiMatch[1]);
            if (isNum) return <img key={index} src={`https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`} className="w-5 h-5 inline-block align-middle mx-[2px] object-contain transition-transform hover:scale-110 duration-200" alt="emoji"/>;
            else return <span key={index} className="inline-flex items-center justify-center bg-secondary/20 text-primary border border-border px-1.5 py-0.5 rounded text-[11px] font-mono mx-[2px]">:{emojiMatch[1]}:</span>;
        }
        return <span key={index}>{part}</span>;
    });
};

const previewReplacer = (text: string, botAvatar: string, userReal: UserProfile | null, guildReal: GuildProfile | null, isTextOnly: boolean = false): string => {
    if (!text) return ""; let msg = text;
    const realUsername = userReal?.username || "username"; const globalName = userReal?.global_name || realUsername;
    const userMention = isTextOnly ? globalName : `<@${globalName}>`; const userId = userReal?.id || "123456789012345678";
    const userAvatarUrl = userReal?.avatar ? `https://cdn.discordapp.com/avatars/${userReal.id}/${userReal.avatar}.${userReal?.avatar?.startsWith("a_") ? "gif" : "png"}?size=256` : "https://cdn.discordapp.com/embed/avatars/0.png";
    const serverName = guildReal?.name || "My Awesome Server"; const serverId = guildReal?.id || "987654321098765432";
    const serverIconUrl = guildReal?.icon ? `https://cdn.discordapp.com/icons/${guildReal.id}/${guildReal.icon}.png` : "https://cdn.discordapp.com/embed/avatars/1.png";
    const realMemberCount = guildReal?.approximate_member_count || guildReal?.member_count || "17";
    msg = msg.replace(/\{user\}/gi, userMention).replace(/\{user\.mention\}/gi, userMention);
    msg = msg.replace(/\{user\.username\}/gi, realUsername).replace(/\{user\.global_name\}/gi, globalName);
    msg = msg.replace(/\{user\.id\}/gi, userId).replace(/\{user\.avatar\}/gi, userAvatarUrl); 
    msg = msg.replace(/\{server\.name\}/gi, serverName).replace(/\{server\.id\}/gi, serverId).replace(/\{server\.icon\}/gi, serverIconUrl); 
    msg = msg.replace(/\{membercount\}/gi, String(realMemberCount)).replace(/\{membercount\.ordinal\}/gi, `${realMemberCount}th`);
    msg = msg.replace(/\{#(.*?)\}/g, (match, p1) => isTextOnly ? `#${p1}` : `<#${p1}>`).replace(/\{@(.*?)\}/g, (match, p1) => isTextOnly ? `@${p1}` : `<@${p1}>`).replace(/\{:(.*?)\}/g, (match, p1) => isTextOnly ? `:${p1}:` : `:${p1}:`); 
    return msg;
};

const ImageInput = memo(({ label, value, onChange, botAvatar, userReal, guildReal }: ImageInputProps) => {
    const [preview, setPreview] = useState("");
    useEffect(() => {
        if (!value) { setPreview(""); return; }
        if (value.includes("{")) { setPreview(previewReplacer(value, botAvatar, userReal, guildReal, true)); return; }
        const img = new Image(); img.src = value; img.onload = () => setPreview(value); img.onerror = () => setPreview(""); 
    }, [value, botAvatar, userReal, guildReal]);
    return (
        <div className="w-full flex-1">
            <label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors flex items-center gap-1"><LinkIcon className="w-3 h-3 text-primary" /> {label}</label>
            <div className="flex gap-2 w-full items-start">
                <SmartInput value={value} onChange={onChange} placeholder="https://... หรือ {user.avatar}" wrapperClassName="flex-1 min-w-0" maxLength={500} showCounter={false} />
                {preview && (<div className="relative group shrink-0"><img src={preview} className="w-[44px] h-[44px] rounded-lg object-cover border border-border shadow-sm group-hover:scale-110 transition-transform duration-300 cursor-pointer" alt="Preview" /></div>)}
            </div>
        </div>
    );
});

export default function AntiSpamPage() {
    const params = useParams(); const guildId = params.id as string; const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const { setIsDirty: setGlobalDirty, shouldShake } = useUnsavedChanges();
    
    // Core Data States
    const [channels, setChannels] = useState<Channel[]>([]); 
    const [roles, setRoles] = useState<Role[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
    const [guildProfile, setGuildProfile] = useState<GuildProfile | null>(null); 
    const [botInfo, setBotInfo] = useState<BotInfo>({ name: "Bot", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
    const [currentTime, setCurrentTime] = useState("");
    
    // UI States
    const [isHelpModalMounted, setIsHelpModalMounted] = useState(false); 
    const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
    const openHelpModal = () => { setIsHelpModalMounted(true); setTimeout(() => setIsHelpModalVisible(true), 10); };
    const closeHelpModal = () => { setIsHelpModalVisible(false); setTimeout(() => setIsHelpModalMounted(false), 300); };
    
    // Time Updater
    useEffect(() => {
        const updateTime = () => { 
            const now = new Date(); 
            const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            setCurrentTime(`วันนี้ เวลา ${timeString} น.`); 
        };
        updateTime(); 
        const interval = setInterval(updateTime, 1000); 
        return () => clearInterval(interval);
    }, []);

    // Form States
    const [isEnabled, setIsEnabled] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [message, setMessage] = useState("");
    const [useEmbed, setUseEmbed] = useState(true);
    const [embedData, setEmbedData] = useState<EmbedData>({ 
        author_name: "", author_icon: "", 
        title: "⛔ พื้นที่หวงห้าม | Restricted Area", 
        description: "**ห้ามส่งข้อความในห้องแชทนี้เด็ดขาด**\nห้องนี้ใช้สำหรับดักจับบอทสแปม", 
        url: "", color: "#ed4245", thumbnail: "", image: "", 
        footer_text: "Anti-Spam System", footer_icon: "", 
        timestamp_mode: 'current', custom_timestamp: "", fields: [] 
    });
    const [spamWords, setSpamWords] = useState<string[]>([]);
    const [newSpamWord, setNewSpamWord] = useState("");
    const [punishment, setPunishment] = useState<"kick" | "ban" | "timeout">("timeout");
    const [timeoutDays, setTimeoutDays] = useState<number | "custom">(7);
    const [customTimeout, setCustomTimeout] = useState<number>(1);

    const [isLogEnabled, setIsLogEnabled] = useState(false);
    const [logChannelId, setLogChannelId] = useState("");
    const [isIgnoreChannelsEnabled, setIsIgnoreChannelsEnabled] = useState(false);
    const [ignoredChannels, setIgnoredChannels] = useState<string[]>([]);
    const [isIgnoreRolesEnabled, setIsIgnoreRolesEnabled] = useState(false);
    const [ignoredRoles, setIgnoredRoles] = useState<string[]>([]);

    const [initialSettings, setInitialSettings] = useState<AntiSpamSettings | null>(null); 
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [me, bot, list, status, antispamRes] = await Promise.all([
                    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).then(r=>r.json()).catch(() => ({})), 
                    fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(r=>r.json()).catch(() => ({})), 
                    fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' }).then(r=>r.json()).catch(() => ([])),
                    fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' }).then(r=>r.json()).catch(() => ({})),
                    fetch(`${API_URL}/api/guilds/${guildId}/antispam`, { credentials: 'include' }).then(r=>r.json()).catch(() => ({}))
                ]);
                
                if(!me.error && me.id) setUserProfile(me); 
                setChannels(bot.channels || []);
                setRoles(bot.roles || [{ id: "101", name: "Admin" }, { id: "102", name: "Moderator" }, { id: "103", name: "Member" }]);
                if(Array.isArray(list)) { const g = list.find((g: any) => g.id === guildId); if(g) setGuildProfile(g); }
                
                if(status.bot_name || status.bot_avatar) {
                    setBotInfo({ name: status.bot_name || "Bot", avatar: status.bot_avatar || "https://cdn.discordapp.com/embed/avatars/0.png" });
                } else if(bot.bot_name || bot.bot_avatar) {
                    setBotInfo({ name: bot.bot_name || "Bot", avatar: bot.bot_avatar || "https://cdn.discordapp.com/embed/avatars/0.png" });
                }

                const fetched: AntiSpamSettings = { 
                    isEnabled: antispamRes.isEnabled ?? false, 
                    selectedChannel: antispamRes.selectedChannel ?? "", 
                    message: antispamRes.message ?? "", 
                    useEmbed: antispamRes.useEmbed ?? true,
                    embedData: { 
                        author_name: antispamRes.embedData?.author_name ?? "", 
                        author_icon: antispamRes.embedData?.author_icon ?? "", 
                        title: antispamRes.embedData?.title ?? "⛔ พื้นที่หวงห้าม | Restricted Area", 
                        description: antispamRes.embedData?.description ?? "**ห้ามส่งข้อความในห้องแชทนี้เด็ดขาด**\nห้องนี้ใช้สำหรับดักจับบอทสแปม", 
                        url: antispamRes.embedData?.url ?? "", 
                        color: antispamRes.embedData?.color ?? "#ed4245", 
                        thumbnail: antispamRes.embedData?.thumbnail ?? "", 
                        image: antispamRes.embedData?.image ?? "", 
                        footer_text: antispamRes.embedData?.footer_text ?? "Anti-Spam System", 
                        footer_icon: antispamRes.embedData?.footer_icon ?? "", 
                        timestamp_mode: antispamRes.embedData?.timestamp_mode ?? 'current', 
                        custom_timestamp: antispamRes.embedData?.custom_timestamp ?? "", 
                        fields: antispamRes.embedData?.fields ?? [] 
                    }, 
                    spamWords: antispamRes.spamWords ?? ["discord.gift", "free nitro"],
                    punishment: antispamRes.punishment ?? "timeout", 
                    timeoutDays: (antispamRes.timeoutDays === "custom" || !['1','3','7','14'].includes(String(antispamRes.timeoutDays))) ? "custom" : Number(antispamRes.timeoutDays), 
                    customTimeout: antispamRes.customTimeout ?? 1,
                    isLogEnabled: antispamRes.isLogEnabled ?? false, 
                    logChannelId: antispamRes.logChannelId ?? "",
                    isIgnoreChannelsEnabled: antispamRes.isIgnoreChannelsEnabled ?? false, 
                    ignoredChannels: antispamRes.ignoredChannels ?? [],
                    isIgnoreRolesEnabled: antispamRes.isIgnoreRolesEnabled ?? false, 
                    ignoredRoles: antispamRes.ignoredRoles ?? []
                };
                
                setIsEnabled(fetched.isEnabled); setSelectedChannel(fetched.selectedChannel); setMessage(fetched.message); setUseEmbed(fetched.useEmbed); setEmbedData(fetched.embedData); setSpamWords(fetched.spamWords); setPunishment(fetched.punishment); setTimeoutDays(fetched.timeoutDays); setCustomTimeout(fetched.customTimeout); 
                setIsLogEnabled(fetched.isLogEnabled); setLogChannelId(fetched.logChannelId);
                setIsIgnoreChannelsEnabled(fetched.isIgnoreChannelsEnabled); setIgnoredChannels(fetched.ignoredChannels);
                setIsIgnoreRolesEnabled(fetched.isIgnoreRolesEnabled); setIgnoredRoles(fetched.ignoredRoles);
                
                setInitialSettings(fetched);

            } catch (err) {
                console.error("Error fetching data", err);
            }
        }; 
        fetchData();
    }, [guildId, API_URL]);

    useEffect(() => { 
        if (!initialSettings) return; 
        const current = { 
            isEnabled, selectedChannel, message, useEmbed, embedData, spamWords, punishment, timeoutDays, customTimeout,
            isLogEnabled, logChannelId, isIgnoreChannelsEnabled, ignoredChannels, isIgnoreRolesEnabled, ignoredRoles
        }; 
        setIsDirty(JSON.stringify(current) !== JSON.stringify(initialSettings)); 
    }, [isEnabled, selectedChannel, message, useEmbed, embedData, spamWords, punishment, timeoutDays, customTimeout, isLogEnabled, logChannelId, isIgnoreChannelsEnabled, ignoredChannels, isIgnoreRolesEnabled, ignoredRoles, initialSettings]);
    
    useEffect(() => {
        setGlobalDirty(isDirty);
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => { setGlobalDirty(false); window.removeEventListener('beforeunload', handleBeforeUnload); };
    }, [isDirty, setGlobalDirty]);

    const handleEmbedChange = (key: keyof EmbedData, value: any) => setEmbedData(prev => ({ ...prev, [key]: value }));
    const handleAddField = () => { if ((embedData.fields?.length || 0) >= 25) { Swal.fire({ title: 'จำกัดจำนวน', text: 'เพิ่มฟิลด์ได้สูงสุด 25 ช่อง', icon: 'warning', background: '#0f172a', color: '#f1f5f9' }); return; } setEmbedData(prev => ({ ...prev, fields: [...(prev.fields || []), { id: Date.now().toString(), name: "New Field", value: "Value", inline: false }] })); };
    const handleUpdateField = (id: string, key: keyof EmbedField, val: any) => { setEmbedData(prev => ({ ...prev, fields: prev.fields?.map(f => f.id === id ? { ...f, [key]: val } : f) })); };
    const handleRemoveField = (id: string) => { setEmbedData(prev => ({ ...prev, fields: prev.fields?.filter(f => f.id !== id) })); };
    
    const handleAddSpamWord = () => { if (newSpamWord.trim() && !spamWords.includes(newSpamWord.trim())) { setSpamWords([...spamWords, newSpamWord.trim()]); setNewSpamWord(""); } };
    const handleRemoveSpamWord = (wordToRemove: string) => { setSpamWords(spamWords.filter((w) => w !== wordToRemove)); };

    const handleSendEmbedNow = async () => {
        if (!selectedChannel) {
            Swal.fire({ title: 'แจ้งเตือน', text: 'กรุณาเลือกห้องกับดักก่อนครับ', icon: 'warning', background: '#0f172a', color: '#f1f5f9' });
            return;
        }

        const confirm = await Swal.fire({
            title: 'ยืนยันการส่ง?',
            text: "ระบบจะเคลียร์ข้อความเก่าของบอทในห้องนั้น และส่งข้อความนี้ลงไปใหม่เพื่อเป็นกับดัก!",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🚀 ส่งเลย!',
            cancelButtonText: 'ยกเลิก',
            background: '#0f172a', color: '#f1f5f9'
        });

        if (!confirm.isConfirmed) return;

        try {
            Swal.fire({ title: 'กำลังส่ง...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });
            
            const payload = {
                channelId: selectedChannel,
                message: message,
                useEmbed: useEmbed,
                embedData: embedData
            };

            const res = await fetch(`${API_URL}/api/guilds/${guildId}/antispam/send_embed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (res.ok) {
                Swal.fire({ title: 'สำเร็จ!', text: 'ส่งข้อความกับดักเรียบร้อยแล้ว', icon: 'success', background: '#0f172a', color: '#f1f5f9' });
            } else {
                const errorData = await res.json();
                Swal.fire({ title: 'ผิดพลาด', text: errorData.detail || 'ไม่สามารถส่งข้อความได้ โปรดตรวจสอบสิทธิ์ของบอทในห้องนั้น', icon: 'error', background: '#0f172a', color: '#f1f5f9' });
            }
        } catch (e) {
            Swal.fire({ title: 'ข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', icon: 'error', background: '#0f172a', color: '#f1f5f9' });
        }
    };

    const handleSave = async (e: FormEvent) => { 
        e.preventDefault(); 
        try {
            Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#f1f5f9' });

            const payload = {
                isEnabled, selectedChannel, message, useEmbed, embedData, spamWords, punishment, 
                timeoutDays: timeoutDays === "custom" ? customTimeout : timeoutDays,
                customTimeout, isLogEnabled, logChannelId, isIgnoreChannelsEnabled, ignoredChannels, 
                isIgnoreRolesEnabled, ignoredRoles
            };

            const res = await fetch(`${API_URL}/api/guilds/${guildId}/antispam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (res.ok) {
                Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', background: '#0f172a', color: '#f1f5f9', timer: 1500 }); 
                setInitialSettings({ 
                    isEnabled, selectedChannel, message, useEmbed, embedData, spamWords, punishment, timeoutDays, customTimeout,
                    isLogEnabled, logChannelId, isIgnoreChannelsEnabled, ignoredChannels, isIgnoreRolesEnabled, ignoredRoles
                }); 
                setIsDirty(false); 
            } else {
                Swal.fire({ title: 'ข้อผิดพลาด!', text: 'เซิร์ฟเวอร์ตอบกลับผิดพลาด', icon: 'error', background: '#0f172a', color: '#f1f5f9' });
            }
        } catch (e) {
            Swal.fire({ title: 'ข้อผิดพลาด!', text: 'ไม่สามารถเชื่อมต่อเพื่อบันทึกข้อมูลได้', icon: 'error', background: '#0f172a', color: '#f1f5f9' });
        }
    };
    
    const handleReset = () => { if (initialSettings) { 
        setIsEnabled(initialSettings.isEnabled); setSelectedChannel(initialSettings.selectedChannel); setMessage(initialSettings.message); setUseEmbed(initialSettings.useEmbed); setEmbedData(initialSettings.embedData); setSpamWords(initialSettings.spamWords); setPunishment(initialSettings.punishment); setTimeoutDays(initialSettings.timeoutDays); setCustomTimeout(initialSettings.customTimeout); 
        setIsLogEnabled(initialSettings.isLogEnabled); setLogChannelId(initialSettings.logChannelId);
        setIsIgnoreChannelsEnabled(initialSettings.isIgnoreChannelsEnabled); setIgnoredChannels(initialSettings.ignoredChannels);
        setIsIgnoreRolesEnabled(initialSettings.isIgnoreRolesEnabled); setIgnoredRoles(initialSettings.ignoredRoles);
    }};

    const EmbedPreview = () => {
        const pTitle = previewReplacer(embedData.title, botInfo.avatar, userProfile, guildProfile, true); 
        const pDesc = previewReplacer(embedData.description, botInfo.avatar, userProfile, guildProfile, false); 
        const pAuthorName = previewReplacer(embedData.author_name, botInfo.avatar, userProfile, guildProfile, true); 
        const pAuthorIcon = previewReplacer(embedData.author_icon, botInfo.avatar, userProfile, guildProfile, false); 
        const pFooterText = previewReplacer(embedData.footer_text, botInfo.avatar, userProfile, guildProfile, true); 
        const pFooterIcon = previewReplacer(embedData.footer_icon, botInfo.avatar, userProfile, guildProfile, false); 
        const pThumbnail = previewReplacer(embedData.thumbnail, botInfo.avatar, userProfile, guildProfile, false); 
        const pImage = previewReplacer(embedData.image, botInfo.avatar, userProfile, guildProfile, false); 
        const pMessage = previewReplacer(message, botInfo.avatar, userProfile, guildProfile, false);
        
        let timeDisplay = currentTime.replace('วันนี้ เวลา ', '').replace(' น.', ''); 
        if (embedData.timestamp_mode === 'custom' && embedData.custom_timestamp) { 
            const d = new Date(embedData.custom_timestamp); 
            if (!isNaN(d.getTime())) timeDisplay = d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) + ' น.'; 
        }

        return (
            <div className="bg-[#313338] p-4 rounded-xl text-[#dbdee1] w-full overflow-hidden border border-border/50 shadow-2xl">
                 <div className="flex items-start gap-3 w-full min-w-0">
                    <img src={botInfo.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-md bg-[#2b2d31]" alt="Bot" onError={(e) => { e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png" }} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm hover:underline cursor-pointer">{botInfo.name}</span>
                            <span className="bg-[#5865f2] text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center shrink-0 leading-none">BOT</span>
                            <span className="text-xs text-[#949ba4] ml-1">{currentTime}</span>
                        </div>
                        {pMessage && <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{parseMarkdown(pMessage)}</div>}
                        {useEmbed && (
                            <div className="mt-2 bg-[#2b2d31] rounded flex w-full border-l-4 overflow-hidden shadow-md" style={{ borderColor: embedData.color }}>
                                <div className="p-4 flex flex-col gap-2 flex-1 min-w-0 overflow-hidden w-full">
                                    {pAuthorName && (<div className="flex items-center gap-2 text-sm font-bold text-white overflow-hidden">{pAuthorIcon && <img src={pAuthorIcon} className="w-6 h-6 rounded-full object-cover shrink-0" alt="Icon" onError={(e) => { e.currentTarget.style.display = 'none' }} />}<span className="break-words">{pAuthorName}</span></div>)}
                                    {pTitle && <div className="font-bold text-white text-base break-words">{parseMarkdown(pTitle)}</div>}
                                    {pDesc && <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">{parseMarkdown(pDesc)}</div>}
                                    {embedData.fields && embedData.fields.length > 0 && (<div className="mt-2 flex flex-wrap w-full">{embedData.fields.map((f) => { const pName = previewReplacer(f.name, botInfo.avatar, userProfile, guildProfile, true) || '\u200b'; const pValue = previewReplacer(f.value, botInfo.avatar, userProfile, guildProfile, false) || '\u200b'; return (<div key={f.id} className={`${f.inline ? 'w-[33.33%] pr-3' : 'w-full'} flex flex-col mb-3`}><div className="font-bold text-sm text-white break-words">{parseMarkdown(pName)}</div><div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">{parseMarkdown(pValue)}</div></div>); })}</div>)}
                                    {pImage && (<div className="mt-2 w-full flex justify-center bg-black/10 rounded overflow-hidden"><img src={pImage} className="max-w-full h-auto object-contain block" alt="Main" onError={(e) => { e.currentTarget.style.display = 'none' }}/></div>)}
                                    {(pFooterText || embedData.timestamp_mode !== 'none') && (<div className="flex items-center gap-2 text-xs text-[#949ba4] mt-1 overflow-hidden opacity-90">{pFooterIcon && <img src={pFooterIcon} className="w-5 h-5 rounded-full shrink-0" alt="Footer" onError={(e) => { e.currentTarget.style.display = 'none' }}/>}<div className="flex items-center gap-1 overflow-hidden">{pFooterText && <span className="break-words">{pFooterText}</span>}{pFooterText && embedData.timestamp_mode !== 'none' && <span className="shrink-0">•</span>}{embedData.timestamp_mode !== 'none' && <span className="shrink-0">{embedData.timestamp_mode === 'current' ? `วันนี้ เวลา ${timeDisplay} น.` : timeDisplay}</span>}</div></div>)}
                                </div>
                                {pThumbnail && <div className="p-4 pl-0 shrink-0 flex items-start"><img src={pThumbnail} className="w-20 h-20 rounded object-cover" alt="Thumb" onError={(e) => { e.currentTarget.style.display = 'none' }}/></div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col pb-32 p-4 md:p-8 min-h-screen max-w-[1920px] mx-auto bg-background/50 font-sans">
            <div className="flex justify-between items-center mb-6 md:mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight drop-shadow-md flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-red-500" /> Anti-Spam & Honeypot
                    </h1>
                    <p className="text-secondary mt-1 md:mt-2 text-sm md:text-lg">จัดการระบบดักจับคำสแปมและตั้งค่าห้องกับดักบอทอัตโนมัติ</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-[1.1] md:scale-125 mr-2 md:mr-4 group"><input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} /><div className="relative w-12 h-6 md:w-14 md:h-7 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(56,189,248,0.5)] group-hover:scale-105 transition-transform duration-300"></div></label>
            </div>

            {/* 💡 Info Box (อธิบายการทำงาน) */}
            <div className="mb-6 md:mb-8 bg-blue-900/20 border border-blue-500/30 p-4 md:p-5 rounded-2xl flex gap-3 md:gap-4 items-start animate-fade-in-up shadow-lg shadow-blue-900/10" style={{ animationDelay: '0.05s' }}>
                <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-sm md:text-sm text-gray-300 leading-relaxed">
                    <span className="text-blue-400 font-bold text-base">ระบบนี้ทำงานอย่างไร?</span>
                    <p className="mt-1">ระบบ Anti-Spam จะคอยตรวจสอบและจัดการผู้กระทำผิดอัตโนมัติ โดยมี 2 กลไกหลัก คือ:</p>
                    <ul className="list-disc list-inside mt-2 ml-2 space-y-1 text-gray-400">
                        <li><strong className="text-gray-300">ห้องกับดัก (Honeypot):</strong> กำหนดห้องที่คนปกติไม่สามารถพิมพ์ได้ หากมีบอทสแปมหลงเข้ามาส่งข้อความ จะถูกลบและลงโทษทันที</li>
                        <li><strong className="text-gray-300">คำต้องห้าม (Blacklisted Words):</strong> สแกนทุกข้อความในเซิร์ฟเวอร์ หากพบลิงก์หรือคำสแปมตามที่ตั้งไว้ บอทจะลบทิ้งและดำเนินการลงโทษ</li>
                        <li><strong className="text-gray-300">ระบบอุทธรณ์:</strong> หากผูใช้คนไหนต้องการยื่นอุทธรณืก็สามารถยื่นเพื่อปลดบทลงโทษได้ โดย logs  จะส่งไปช่องเดียวกับช่องระบบแจ้งเตือน เพื่อให้แอดมินกด ได้ด้วย</li>
                    </ul>
                </div>
            </div>

            {/* 🔥 เพิ่ม Class ตรงนี้เพื่อจัดการลดความสว่างและการคลิกเมื่อระบบปิดอยู่ */}
            <div className={`grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 transition-all duration-300 ${!isEnabled ? 'opacity-50 pointer-events-none select-none grayscale-[20%]' : 'opacity-100 grayscale-0'}`}>
                {/* ---------------- LEFT COLUMN: Setup Settings ---------------- */}
                <div className="xl:col-span-7 space-y-6 md:space-y-8">
                    
                    {/* General Settings */}
                    <div className="relative z-[40] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 border-b border-border/50 pb-3 flex items-center gap-2"><Layout className="w-5 h-5 text-primary" /> การตั้งค่าทั่วไป (General Settings)</h2>
                        <div className="space-y-4 md:space-y-6">
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2 md:mb-4 tracking-wide">ห้องกับดัก (ควรตั้ง Permission ให้คนปกติพิมพ์ไม่ได้)</label>
                                {/* 🔥 ใช้ ChannelSelect */}
                                <ChannelSelect 
                                    channels={channels} 
                                    selectedChannelId={selectedChannel} 
                                    onChange={setSelectedChannel} 
                                    placeholder="-- เลือกห้องสำหรับดักสแปม --"
                                />
                            </div>
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2 md:mb-4 tracking-wide">ข้อความหลัก (Plain Text Message)</label>
                                <SmartInput value={message} onChange={setMessage} placeholder="พิมพ์ข้อความธรรมดาที่นี่ (แสดงผลนอกกรอบ Embed)..." maxLength={2000} />
                            </div>
                            
                            <button
                                type="button"
                                onClick={handleSendEmbedNow}
                                className="w-full flex items-center justify-center gap-2 bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-white p-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-primary/30 active:scale-[0.98] mt-2"
                            >
                                <Send className="w-4 h-4 md:w-5 md:h-5" /> 🚀 ส่งข้อความลงห้องกับดักเดี๋ยวนี้ (Test Send)
                            </button>
                        </div>
                    </div>

                    {/* Embed Settings */}
                    <div className="relative z-[30] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/50 pb-4 gap-4 sm:gap-0">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4"><h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Embed Setup</h2></div>
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <button onClick={openHelpModal} className="w-full sm:w-auto justify-center flex items-center gap-2 bg-secondary/30 hover:bg-primary/20 active:scale-95 border border-border px-3 py-1.5 md:py-2 rounded-lg text-secondary transition-all duration-300 hover:text-primary shadow-sm text-xs font-medium group"><BookOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" /><span>คู่มือตัวแปร</span></button>
                                <label className="hidden sm:inline-flex relative items-center cursor-pointer group"><span className="mr-3 text-sm font-medium text-secondary transition-colors group-hover:text-primary">{useEmbed ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} /><div className="relative w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(56,189,248,0.5)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all group-hover:scale-105 transition-transform duration-300"></div></label>
                            </div>
                        </div>

                        <div className={`grid transition-all duration-500 ease-in-out ${useEmbed ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                            <div className={useEmbed ? "overflow-visible space-y-4 md:space-y-6" : "overflow-hidden"}>
                                <div className="flex flex-col sm:flex-row gap-4"><div className="flex-1 w-full"><ImageInput label="Author Icon" value={embedData.author_icon} onChange={(v) => handleEmbedChange('author_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div><div className="flex-1 w-full"><label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide">Author Name</label><SmartInput value={embedData.author_name} onChange={(v) => handleEmbedChange('author_name', v)} placeholder="{bot.name}" maxLength={100} /></div></div>
                                <div><label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide">Title</label><SmartInput value={embedData.title} onChange={(v) => handleEmbedChange('title', v)} className="font-bold" maxLength={100} /></div>
                                <div><label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide">Description</label><SmartInput isTextarea={true} maxLength={2000} value={embedData.description} onChange={(v) => handleEmbedChange('description', v)} className="min-h-[100px] md:min-h-[120px]" /></div>
                                <div className="flex flex-col sm:flex-row gap-4 items-end"><div className="w-full sm:w-40 shrink-0"><label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide">Color</label><div className="flex gap-2 group h-[38px] md:h-[42px]"><div className="relative w-10 md:w-12 h-full rounded-lg overflow-hidden border border-border group-hover:border-primary shrink-0 hover:scale-105 transition-all duration-300"><DebouncedColorInput value={embedData.color} onChange={(val) => handleEmbedChange('color', val)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" /></div><input type="text" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="flex-1 w-full bg-secondary/30 text-foreground px-2 md:px-2.5 rounded-lg border border-border uppercase font-mono text-sm group-hover:border-primary transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20" /></div></div><div className="flex-1 w-full mt-4 sm:mt-0"><ImageInput label="Thumbnail URL" value={embedData.thumbnail} onChange={(v) => handleEmbedChange('thumbnail', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div></div>
                                <div className="w-full pt-2"><ImageInput label="Image URL" value={embedData.image} onChange={(v) => handleEmbedChange('image', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                
                                <div className="border-t border-border pt-6 space-y-6">
                                    <div className="space-y-4">
                                        <label className="block text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1"><Columns className="w-3 h-3 md:w-4 md:h-4 text-primary" /> Embed Fields <span className="bg-secondary/20 border border-border text-secondary px-2 py-0.5 rounded-full ml-2 text-[9px] md:text-[10px]">{(embedData.fields || []).length}/25</span></label>
                                        <div className="space-y-4">
                                            {(embedData.fields || []).map((field) => (
                                                <div key={field.id} className="bg-secondary/10 p-3 md:p-4 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 md:gap-4 relative group hover:border-primary/50 transition-colors">
                                                    <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><button type="button" onClick={() => handleRemoveField(field.id)} className="text-red-400 hover:text-red-500 hover:bg-red-400/10 p-1.5 rounded transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button></div>
                                                    <div className="flex gap-3 md:gap-4 items-center pr-8 md:pr-10">
                                                        <div className="flex-1"><label className="block text-secondary text-[9px] md:text-[10px] uppercase mb-1 font-bold">Name (Max 256)</label><SmartInput value={field.name} onChange={v => handleUpdateField(field.id, 'name', v)} maxLength={256} /></div>
                                                        <div className="shrink-0 flex flex-col items-center"><label className="block text-secondary text-[9px] md:text-[10px] uppercase mb-1.5 font-bold">Inline</label><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={field.inline} onChange={e => handleUpdateField(field.id, 'inline', e.target.checked)} /><div className="w-8 h-4 md:w-9 md:h-5 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all"></div></label></div>
                                                    </div>
                                                    <div><label className="block text-secondary text-[9px] md:text-[10px] uppercase mb-1 font-bold">Value (Max 1024)</label><SmartInput isTextarea value={field.value} onChange={v => handleUpdateField(field.id, 'value', v)} className="min-h-[50px] md:min-h-[60px]" maxLength={1024} /></div>
                                                </div>
                                            ))}
                                            {(embedData.fields?.length === 0 || !embedData.fields) && (<div className="text-center p-4 md:p-6 border-2 border-dashed border-border rounded-xl text-secondary text-[10px] md:text-xs">ยังไม่มีฟิลด์ กดปุ่ม Add Field ด้านล่างเพื่อเพิ่มข้อมูล</div>)}
                                        </div>
                                        <button onClick={handleAddField} type="button" className="flex w-full items-center justify-center gap-2 text-[10px] md:text-xs bg-secondary/30 hover:bg-primary/20 active:scale-[0.99] border border-border text-secondary hover:text-primary py-2.5 md:py-3 rounded-xl transition-all shadow-sm group font-medium mt-2"><Plus className="w-4 h-4 text-primary group-hover:scale-125 transition-transform" /> เพิ่มฟิลด์ใหม่ (Add Field)</button>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border"><div className="flex-1 w-full"><ImageInput label="Footer Icon" value={embedData.footer_icon} onChange={(v) => handleEmbedChange('footer_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div><div className="flex-1 w-full"><label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide">Footer Text</label><SmartInput value={embedData.footer_text} onChange={(v) => handleEmbedChange('footer_text', v)} maxLength={100} /></div></div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-secondary/10 p-3 md:p-4 rounded-xl border border-border">
                                        <div className="w-full sm:w-1/3 shrink-0">
                                            <label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> Timestamp</label>
                                            {/* 🔥 ใช้ CustomSelect แทน */}
                                            <CustomSelect 
                                                value={embedData.timestamp_mode} 
                                                onChange={(val) => handleEmbedChange('timestamp_mode', val)} 
                                                options={[
                                                    { value: "none", label: "ปิด (Off)" },
                                                    { value: "current", label: "เวลาปัจจุบัน" },
                                                    { value: "custom", label: "กำหนดเอง" }
                                                ]}
                                            />
                                        </div>
                                        {embedData.timestamp_mode === 'custom' && (
                                            <div className="flex-1 w-full animate-in fade-in slide-in-from-left-4 duration-300 mt-2 sm:mt-0">
                                                <label className="block text-secondary text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide">เลือกวันและเวลา</label>
                                                <input type="datetime-local" value={embedData.custom_timestamp} onChange={(e) => handleEmbedChange('custom_timestamp', e.target.value)} className="w-full bg-secondary/30 text-foreground p-2 md:p-2.5 rounded-lg border border-border focus:border-primary text-sm focus:ring-2 focus:ring-primary/20 transition-all duration-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Punishment Settings */}
                    <div className="relative z-[20] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 border-b border-border/50 pb-3 flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-primary" /> บทลงโทษ (Punishment)
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-secondary text-xs font-bold uppercase mb-3 tracking-wide">เลือกการลงโทษอัตโนมัติเมื่อกระทำผิด</label>
                                <div className="flex bg-secondary/30 rounded-lg p-1 border border-border">
                                    {[ { id: "timeout", label: "⏱️ Timeout" }, { id: "kick", label: "🚪 Kick" }, { id: "ban", label: "🔨 Ban" } ].map(act => (
                                        <button key={act.id} type="button" onClick={() => setPunishment(act.id as any)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:scale-[1.02] active:scale-95 ${punishment === act.id ? 'bg-primary text-white shadow-md' : 'text-secondary hover:bg-secondary/50'}`}>{act.label}</button>
                                    ))}
                                </div>
                            </div>

                            <div className={`overflow-hidden transition-all duration-500 ${punishment === "timeout" ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                                <div className="bg-secondary/10 p-4 rounded-xl border border-border mt-2">
                                    <label className="block text-secondary text-xs font-bold uppercase mb-3 tracking-wide">ระยะเวลา Timeout</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {[1, 3, 7, 14].map((days) => (
                                            <button key={days} type="button" onClick={() => setTimeoutDays(days)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${timeoutDays === days ? "bg-primary text-white shadow-md" : "bg-secondary/30 text-secondary hover:bg-secondary/50"}`}>{days} วัน</button>
                                        ))}
                                        <button type="button" onClick={() => setTimeoutDays("custom")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${timeoutDays === "custom" ? "bg-primary text-white shadow-md" : "bg-secondary/30 text-secondary hover:bg-secondary/50"}`}>กำหนดเอง</button>
                                    </div>
                                    {timeoutDays === "custom" && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                                            <input type="number" min="1" max="28" value={customTimeout} onChange={(e) => setCustomTimeout(Number(e.target.value))} className="w-24 bg-secondary/30 text-foreground p-2 rounded-lg border border-border focus:border-primary text-sm text-center focus:ring-2 focus:ring-primary/20 transition-all" />
                                            <span className="text-secondary text-xs font-medium">วัน (สูงสุด 28 วัน)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Spam Words */}
                    <div className="relative z-[15] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up h-[320px] flex flex-col" style={{ animationDelay: '0.4s' }}>
                        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 border-b border-border/50 pb-3 flex items-center gap-2 shrink-0">
                            <Type className="w-5 h-5 text-primary" /> จัดการคำสแปม (Blacklisted Words)
                        </h2>
                        
                        <div className="flex gap-2 mb-4 shrink-0">
                            <input type="text" value={newSpamWord} onChange={(e) => setNewSpamWord(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSpamWord()} placeholder="เพิ่มคำสแปม เช่น discord.gift..." className="flex-1 w-full bg-secondary/30 text-foreground p-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 placeholder:text-secondary/50 text-sm" />
                            <button type="button" onClick={handleAddSpamWord} className="flex items-center justify-center gap-1 bg-secondary/30 hover:bg-primary/20 active:scale-95 border border-border text-secondary hover:text-primary px-4 rounded-xl transition-all duration-300 shadow-sm font-medium"><Plus className="w-5 h-5" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-secondary/10 rounded-xl p-4 border border-border custom-scrollbar">
                            {spamWords.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-secondary/50">
                                    <span className="text-3xl mb-2">👻</span><p className="text-sm font-medium">ยังไม่มีคำสแปมในระบบ</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 content-start">
                                    {spamWords.map((word, idx) => (
                                        <div key={idx} className="group flex items-center bg-card text-foreground text-sm py-1.5 pl-3 pr-1 rounded-full border border-border hover:border-red-500/50 transition-colors animate-in fade-in zoom-in duration-300 shadow-sm">
                                            <span className="mr-2">{word}</span>
                                            <button onClick={() => handleRemoveSpamWord(word)} className="bg-secondary/20 text-secondary group-hover:bg-red-500 group-hover:text-white w-6 h-6 rounded-full flex items-center justify-center transition-all"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NEW: Log Notifications Settings */}
                    <div className="relative z-[10] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/50 pb-4 gap-4 sm:gap-0">
                            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><BellRing className="w-5 h-5 text-primary" /> ระบบแจ้งเตือน (Log Notification)</h2>
                            <label className="relative inline-flex items-center cursor-pointer group"><span className="mr-3 text-sm font-medium text-secondary transition-colors group-hover:text-primary">{isLogEnabled ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={isLogEnabled} onChange={(e) => setIsLogEnabled(e.target.checked)} /><div className="relative w-11 h-6 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(56,189,248,0.5)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all group-hover:scale-105 transition-transform duration-300"></div></label>
                        </div>
                        <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${isLogEnabled ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                            <div className={isLogEnabled ? "overflow-visible" : "overflow-hidden"}>
                                <label className="block text-secondary text-xs font-bold uppercase mb-2 md:mb-4 tracking-wide">ห้องแจ้งเตือน (ส่ง Log เมื่อมีคนโดนลงโทษ)</label>
                                {/* 🔥 ใช้ ChannelSelect */}
                                <ChannelSelect 
                                    channels={channels} 
                                    selectedChannelId={logChannelId} 
                                    onChange={setLogChannelId} 
                                    placeholder="-- เลือกห้องสำหรับส่งแจ้งเตือน --"
                                />
                            </div>
                        </div>
                    </div>

                    {/* NEW: Exceptions (Ignored Channels & Roles) */}
                    <div className="relative z-[5] bg-card backdrop-blur-md p-5 md:p-8 rounded-3xl border border-border shadow-xl hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                        <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 border-b border-border/50 pb-3 flex items-center gap-2"><ShieldOff className="w-5 h-5 text-primary" /> ข้อยกเว้น (Exceptions)</h2>
                        
                        <div className="space-y-8">
                            {/* Ignored Channels */}
                            <div className="bg-secondary/10 p-4 md:p-5 rounded-xl border border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-secondary text-xs font-bold uppercase tracking-wide">ห้องที่ละเว้น (Ignored Channels)</label>
                                    <label className="relative inline-flex items-center cursor-pointer group"><span className="mr-3 text-xs font-medium text-secondary transition-colors group-hover:text-primary">{isIgnoreChannelsEnabled ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={isIgnoreChannelsEnabled} onChange={(e) => setIsIgnoreChannelsEnabled(e.target.checked)} /><div className="relative w-9 h-5 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label>
                                </div>
                                <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${isIgnoreChannelsEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className={isIgnoreChannelsEnabled ? "overflow-visible" : "overflow-hidden"}>
                                        <div className="pt-2">
                                            {/* 🔥 ใช้ MultiChannelSelect */}
                                            <MultiChannelSelect 
                                                channels={channels} 
                                                selectedChannels={ignoredChannels} 
                                                onChange={setIgnoredChannels} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ignored Roles */}
                            <div className="bg-secondary/10 p-4 md:p-5 rounded-xl border border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-secondary text-xs font-bold uppercase tracking-wide">ยศที่ละเว้น (Ignored Roles)</label>
                                    <label className="relative inline-flex items-center cursor-pointer group"><span className="mr-3 text-xs font-medium text-secondary transition-colors group-hover:text-primary">{isIgnoreRolesEnabled ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={isIgnoreRolesEnabled} onChange={(e) => setIsIgnoreRolesEnabled(e.target.checked)} /><div className="relative w-9 h-5 bg-slate-700/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label>
                                </div>
                                <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${isIgnoreRolesEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className={isIgnoreRolesEnabled ? "overflow-visible" : "overflow-hidden"}>
                                        <div className="pt-2">
                                            {/* 🔥 ใช้ MultiRoleSelect */}
                                            <MultiRoleSelect 
                                                roles={roles} 
                                                selectedRoles={ignoredRoles} 
                                                onChange={setIgnoredRoles} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ---------------- RIGHT COLUMN: Sticky Preview ---------------- */}
                <div className="xl:col-span-5 relative w-full h-full xl:mt-0 z-[50]">
                    <div className="sticky top-4 md:top-6 z-10 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-2 w-full lg:max-w-2xl">
                            <h3 className="text-secondary text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1 md:gap-2"><Eye className="w-4 h-4"/> Live Preview Embed</h3>
                            <span className="text-[9px] md:text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full animate-pulse">● Live Update</span>
                        </div>
                        <div className="w-full lg:max-w-2xl">
                            <EmbedPreview />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:ml-64 flex justify-center items-center transition-all duration-500 transform pointer-events-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-[200]`}>
                <div className={`pointer-events-auto bg-[#111214]/95 backdrop-blur-md border border-border p-3 md:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-500 ${shouldShake ? 'animate-shake-error' : ''}`}>
                    <span className="text-white font-medium flex items-center gap-2 pl-2 text-sm md:text-base"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button type="button" onClick={handleReset} className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-secondary hover:text-foreground px-3 md:px-4 py-2 rounded-xl hover:bg-secondary/20 transition-all font-medium text-xs md:text-sm bg-secondary/10 sm:bg-transparent"><RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> Reset</button>
                        <button type="submit" onClick={handleSave} className="flex-1 sm:flex-none justify-center bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 md:px-6 rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center gap-2 text-xs md:text-sm"><Save className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง (Save)</span><span className="sm:hidden">บันทึก</span></button>
                    </div>
                </div>
            </div>

            {/* Help Modal */}
            {isHelpModalMounted && (<div className={`fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isHelpModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeHelpModal}><div className={`bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden transition-all duration-300 ease-out transform ${isHelpModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`} onClick={e => e.stopPropagation()}><div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-secondary/10 shrink-0"><h3 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2"><span className="font-mono bg-secondary/20 px-2 py-1 rounded text-primary shadow-sm">{`{}`}</span> คู่มือ & Markdown</h3><button onClick={closeHelpModal} className="text-secondary hover:text-foreground hover:bg-secondary/20 p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90"><svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 md:space-y-8"><section><h4 className="text-foreground font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Layers className="w-4 h-4 md:w-5 md:h-5 text-green-500" /> ตัวแปรที่ใช้ได้ (Variables)</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">{AVAILABLE_VARS.map((v, i) => (<div key={v.name} className={`bg-secondary/10 p-2 md:p-3 rounded-xl border border-border flex flex-col gap-1 hover:border-primary hover:shadow-md transition-all duration-500 ease-out transform ${isHelpModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${i * 30}ms` }}><span className="font-mono text-foreground font-bold text-xs md:text-sm bg-secondary/20 px-2 py-0.5 rounded w-fit">{`{${v.name}}`}</span><span className="text-secondary text-[10px] md:text-xs">{v.desc}</span></div>))}</div></section><section><h4 className="text-foreground font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Type className="w-4 h-4 md:w-5 md:h-5 text-primary" /> การจัดรูปแบบข้อความ (Discord Markdown)</h4><div className={`bg-secondary/10 rounded-xl border border-border overflow-x-auto hover:border-primary/50 transition-all duration-500 ease-out transform shadow-sm ${isHelpModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}><table className="w-full text-left text-xs md:text-sm min-w-[400px]"><thead className="bg-secondary/20 border-b border-border text-secondary"><tr><th className="p-2 md:p-3 font-semibold w-1/2">พิมพ์แบบนี้</th><th className="p-2 md:p-3 font-semibold w-1/2">ผลลัพธ์ที่ได้</th></tr></thead><tbody className="text-foreground divide-y divide-border"><tr className="hover:bg-secondary/20 transition-colors"><td className="p-2 md:p-3 font-mono">**ตัวหนา**</td><td className="p-2 md:p-3"><strong>ตัวหนา</strong></td></tr><tr className="hover:bg-secondary/20 transition-colors"><td className="p-2 md:p-3 font-mono">*ตัวเอียง* หรือ _ตัวเอียง_</td><td className="p-2 md:p-3"><em className="italic">ตัวเอียง</em></td></tr></tbody></table></div></section></div></div></div>)}
        </div>
    );
}