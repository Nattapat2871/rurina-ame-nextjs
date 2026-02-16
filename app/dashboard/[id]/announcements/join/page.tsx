"use client";

import { useEffect, useState, useRef, ChangeEvent, MouseEvent, FormEvent, memo } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Save, RotateCcw, Image as ImageIcon, Layout, Type, Layers, Palette, Info, BookOpen, Link as LinkIcon, Clock, Plus, Trash2, Columns } from 'lucide-react';

// --- 🟦 TypeScript Interfaces ---
interface UserProfile { username: string; global_name: string; id: string; avatar: string; }
interface GuildProfile { name: string; id: string; icon: string; approximate_member_count?: number; member_count?: number; }
interface Channel { id: string; name: string; category?: string; }
interface BotInfo { name: string; avatar: string; }
interface EmbedField { id: string; name: string; value: string; inline: boolean; }
interface EmbedData { author_name: string; author_icon: string; title: string; description: string; url: string; color: string; thumbnail: string; image: string; footer_text: string; footer_icon: string; timestamp_mode: 'none' | 'current' | 'custom'; custom_timestamp: string; fields?: EmbedField[]; }
interface ImageData { bg_url: string; image_title: string; image_username: string; text_content: string; font_name: string; avatar_shape: 'circle' | 'square'; overlay_opacity: number; image_position: 'left' | 'center' | 'right' | 'text'; title_color: string; username_color: string; message_color: string; circle_color: string; overlay_color: string; }
interface SmartInputProps { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; wrapperClassName?: string; isTextarea?: boolean; maxLength?: number; showCounter?: boolean; }
interface ImageInputProps { label: string; value: string; onChange: (value: string) => void; botAvatar: string; userReal: UserProfile | null; guildReal: GuildProfile | null; }
interface JoinSettings { isEnabled: boolean; selectedChannel: string; message: string; useEmbed: boolean; embedData: EmbedData; useImage: boolean; imageData: ImageData; }
interface ImagePreviewProps { imageData: ImageData; botInfo: BotInfo; userProfile: UserProfile | null; guildProfile: GuildProfile | null; guildId: string | string[]; API_URL: string; }

// --- 📜 Available Variables ---
const AVAILABLE_VARS = [
    { name: "user", desc: "แท็กผู้ใช้ (@GlobalName)" }, { name: "user.username", desc: "ชื่อผู้ใช้จริง (Username)" }, { name: "user.global_name", desc: "ชื่อที่แสดง (Global Name)" },
    { name: "user.id", desc: "ไอดีผู้ใช้" }, { name: "user.avatar", desc: "ลิงก์รูปโปรไฟล์" }, { name: "server.name", desc: "ชื่อเซิร์ฟเวอร์" },
    { name: "server.id", desc: "ไอดีเซิร์ฟเวอร์" }, { name: "server.icon", desc: "ลิงก์ไอคอนเซิร์ฟเวอร์" }, { name: "membercount", desc: "จำนวนสมาชิก" },
    { name: "membercount.ordinal", desc: "ลำดับสมาชิก (ex. 17th)" }, { name: "#channel_name", desc: "แท็กห้อง (ใส่ชื่อ/ID ใน {})" },
    { name: "@role_name", desc: "แท็กยศ (ใส่ชื่อ/ID ใน {})" }, { name: ":emoji_name", desc: "ใส่อิโมจิ (ใส่ชื่อ/ID ใน {})" }
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

    return (
        <div className={`relative w-full ${wrapperClassName || ""}`}>
            {showCounter && maxLength && (<div className={`absolute -top-5 right-0 text-[10px] font-mono select-none pointer-events-none transition-colors duration-150 ${value.length >= maxLength ? 'text-red-500 font-bold' : 'text-[#949ba4]'}`}>{value.length}/{maxLength}</div>)}
            {isTextarea ? (<textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={value} onChange={handleChange} className={`transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5865f2]/50 custom-scrollbar ${className}`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />) : (<input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" value={value} onChange={handleChange} className={`transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5865f2]/50 ${className}`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />)}
            {showMenu && (
                <div className="absolute z-50 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-2xl mt-2 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar animate-in fade-in zoom-in-95 duration-200" style={{ top: '100%', left: 0 }}>
                    {AVAILABLE_VARS.filter(v => v.name.toLowerCase().includes(filter)).map(v => (
                        <div key={v.name} onMouseDown={(e: MouseEvent<HTMLDivElement>) => { e.preventDefault(); insertVar(v.name); }} className="px-3 py-2 hover:bg-[#404249] cursor-pointer flex justify-between items-center transition-colors border-b border-[#1e1f22]/50 last:border-0"><span className="font-bold text-[#dbdee1] font-mono text-xs">{`{${v.name}}`}</span><span className="text-[#949ba4] text-[10px] bg-[#1e1f22] px-2 py-0.5 rounded-full">{v.desc}</span></div>
                    ))}
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
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/); if (linkMatch) return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#00b0f4] hover:underline cursor-pointer break-words transition-colors duration-200">{linkMatch[1]}</a>;
        const boldMatch = part.match(/^\*\*(.*?)\*\*$/); if (boldMatch) return <strong key={index} className="font-bold">{boldMatch[1]}</strong>;
        const underlineMatch = part.match(/^__(.*?)__$/); if (underlineMatch) return <u key={index} className="underline">{underlineMatch[1]}</u>;
        const strikeMatch = part.match(/^~~(.*?)~~$/); if (strikeMatch) return <s key={index} className="line-through">{strikeMatch[1]}</s>;
        const italicMatch = part.match(/^\*(.*?)\*$/) || part.match(/^_(.*?)_$/); if (italicMatch) return <em key={index} className="italic">{italicMatch[1]}</em>;
        const codeMatch = part.match(/^`(.*?)`$/); if (codeMatch) return <code key={index} className="bg-[#1e1f22] text-[#dbdee1] px-1.5 py-0.5 rounded text-[13px] font-mono">{codeMatch[1]}</code>;
        const mentionMatch = part.match(/^<@([^>]+)>$/); if (mentionMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium inline-block break-words cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors duration-200">@{mentionMatch[1]}</span>;
        const channelMatch = part.match(/^<#([^>]+)>$/); if (channelMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium inline-block break-words cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors duration-200">#{channelMatch[1]}</span>;
        const emojiMatch = part.match(/^:([a-zA-Z0-9_]+):$/); 
        if (emojiMatch) {
            const isNum = /^\d+$/.test(emojiMatch[1]);
            if (isNum) return <img key={index} src={`https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`} className="w-5 h-5 inline-block align-middle mx-[2px] object-contain transition-transform hover:scale-110 duration-200" alt="emoji"/>;
            else return <span key={index} className="inline-flex items-center justify-center bg-[#1e1f22] text-[#00b0f4] border border-[#3f4147] px-1.5 py-0.5 rounded text-[11px] font-mono mx-[2px] shadow-sm">:{emojiMatch[1]}:</span>;
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
            <label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1] flex items-center gap-1"><LinkIcon className="w-3 h-3 text-[#00b0f4]" /> {label}</label>
            <div className="flex gap-2 w-full items-start">
                <SmartInput value={value} onChange={onChange} placeholder="https://... หรือ {user.avatar}" wrapperClassName="flex-1 min-w-0" className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 md:p-2.5 rounded-md border border-[#1e1f22] text-sm hover:border-[#3f4147] transition-all duration-300 focus:scale-[1.01] focus:ring-[#5865f2]/50 focus:ring-2 focus:outline-none" maxLength={500} showCounter={false} />
                {preview && (<div className="relative group shrink-0"><img src={preview} className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-md object-cover border border-[#1e1f22] shadow-sm group-hover:scale-110 transition-transform duration-300 cursor-pointer" alt="Preview" /></div>)}
            </div>
        </div>
    );
});

const ImagePreview = ({ imageData, botInfo, userProfile, guildProfile, guildId, API_URL }: ImagePreviewProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        let isCancelled = false; setIsLoading(true);
        const timer = setTimeout(async () => {
            const pTitle = previewReplacer(imageData.image_title, botInfo.avatar, userProfile, guildProfile, true);
            const pUsername = previewReplacer(imageData.image_username, botInfo.avatar, userProfile, guildProfile, true);
            const pText = previewReplacer(imageData.text_content, botInfo.avatar, userProfile, guildProfile, true);
            const userAvatarUrl = userProfile?.avatar ? `https://cdn.discordapp.com/avatars/${userProfile.id}/${userProfile.avatar}.${userProfile?.avatar?.startsWith("a_") ? "gif" : "png"}?size=256` : botInfo.avatar;
            try {
                const res = await fetch(`${API_URL}/api/announcements/${guildId}/preview_join_image`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bg_url: imageData.bg_url, image_title: pTitle, image_username: pUsername, text_content: pText, font_name: imageData.font_name,
                        avatar_url: userAvatarUrl, avatar_shape: imageData.avatar_shape, overlay_opacity: imageData.overlay_opacity, image_position: imageData.image_position,
                        title_color: imageData.title_color, username_color: imageData.username_color, message_color: imageData.message_color, circle_color: imageData.circle_color, overlay_color: imageData.overlay_color
                    })
                });
                if (res.ok && !isCancelled) { const blob = await res.blob(); const newUrl = URL.createObjectURL(blob); setPreviewUrl(prev => { if(prev) URL.revokeObjectURL(prev); return newUrl; }); }
            } catch (e) { console.error(e); } finally { if(!isCancelled) setIsLoading(false); }
        }, 800);
        return () => { isCancelled = true; clearTimeout(timer); };
    }, [imageData, userProfile, guildProfile, guildId, API_URL, botInfo.avatar]);
    return (
        <div className="relative w-full rounded-xl overflow-hidden border border-[#1e1f22] shadow-2xl bg-[#1a1b1e] hover:shadow-3xl transition-shadow duration-500">
             <div className="aspect-[1000/480] w-full relative bg-[#232428]">
                {previewUrl ? (<img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain animate-in fade-in duration-500" />) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-[#949ba4] animate-pulse"><ImageIcon className="w-10 h-10 md:w-12 md:h-12 mb-2 opacity-50" /><span className="text-[10px] md:text-xs font-mono">RENDERING PREVIEW...</span></div>)}
                {isLoading && previewUrl && (<div className="absolute top-2 right-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></div>)}
             </div>
        </div>
    );
};

export default function JoinSettingsPage() {
    const params = useParams(); const guildId = params.id as string; const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const [channels, setChannels] = useState<Channel[]>([]); const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
    const [guildProfile, setGuildProfile] = useState<GuildProfile | null>(null); const [availableFonts, setAvailableFonts] = useState<string[]>(["Default"]);
    const [selectedChannel, setSelectedChannel] = useState(""); const [message, setMessage] = useState(""); const [isEnabled, setIsEnabled] = useState(false);
    const [botInfo, setBotInfo] = useState<BotInfo>({ name: "Bot", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
    const [currentTime, setCurrentTime] = useState("");
    const [isHelpModalMounted, setIsHelpModalMounted] = useState(false); const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
    const openHelpModal = () => { setIsHelpModalMounted(true); setTimeout(() => setIsHelpModalVisible(true), 10); };
    const closeHelpModal = () => { setIsHelpModalVisible(false); setTimeout(() => setIsHelpModalMounted(false), 300); };
    useEffect(() => {
        const updateTime = () => { const now = new Date(); setCurrentTime("Today at " + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })); };
        updateTime(); const interval = setInterval(updateTime, 1000); return () => clearInterval(interval);
    }, []);

    const [useEmbed, setUseEmbed] = useState(false);
    const [embedData, setEmbedData] = useState<EmbedData>({ author_name: "", author_icon: "", title: "", description: "", url: "", color: "#5865f2", thumbnail: "", image: "", footer_text: "", footer_icon: "", timestamp_mode: "none", custom_timestamp: "", fields: [] });
    const [useImage, setUseImage] = useState(false);
    const [imageData, setImageData] = useState<ImageData>({ bg_url: "", image_title: "WELCOME", image_username: "{user.username}", text_content: "Welcome to {server.name}!", font_name: "Kanit-Regular.ttf", avatar_shape: "circle", overlay_opacity: 50, image_position: "left", title_color: "#FFFFFF", username_color: "#00FFFF", message_color: "#FFFFFF", circle_color: "#FFFFFF", overlay_color: "#000000" });
    const [initialSettings, setInitialSettings] = useState<JoinSettings | null>(null); const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [me, bot, list, fonts, status] = await Promise.all([
                fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).then(r=>r.json()), fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(r=>r.json()), fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' }).then(r=>r.json()), fetch(`${API_URL}/api/announce/list_fonts`, { credentials: 'include' }).then(r=>r.json()), fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' }).then(r=>r.json())
            ]);
            if(!me.error) setUserProfile(me); setChannels(bot.channels || []);
            if(Array.isArray(list)) { const g = list.find((g: any) => g.id === guildId); if(g) setGuildProfile(g); }
            if(fonts.fonts) setAvailableFonts(fonts.fonts);
            const fetched: JoinSettings = { isEnabled: status.is_welcome_enabled || false, selectedChannel: status.welcome_channel_id || "", message: status.welcome_message || "", useEmbed: status.use_embed || false, embedData: { ...embedData, ...(status.embed_data || {}) }, useImage: status.use_image || false, imageData: { ...imageData, ...(status.image_data || {}) } };
            if(status.bot_name || status.bot_avatar) setBotInfo({ name: status.bot_name || "Bot", avatar: status.bot_avatar });
            setIsEnabled(fetched.isEnabled); setSelectedChannel(fetched.selectedChannel); setMessage(fetched.message); setUseEmbed(fetched.useEmbed); setEmbedData(fetched.embedData); setUseImage(fetched.useImage); setImageData(fetched.imageData); setInitialSettings(fetched);
        }; fetchData();
    }, [guildId, API_URL]);

    useEffect(() => { if (!initialSettings) return; const current = { isEnabled, selectedChannel, message, useEmbed, embedData, useImage, imageData }; setIsDirty(JSON.stringify(current) !== JSON.stringify(initialSettings)); }, [isEnabled, selectedChannel, message, useEmbed, embedData, useImage, imageData, initialSettings]);
    const handleEmbedChange = (key: keyof EmbedData, value: any) => setEmbedData(prev => ({ ...prev, [key]: value }));
    const handleImageChange = (key: keyof ImageData, value: string | number) => setImageData(prev => ({ ...prev, [key]: value }));
    const handleAddField = () => { if ((embedData.fields?.length || 0) >= 25) { Swal.fire({ title: 'จำกัดจำนวน', text: 'เพิ่มฟิลด์ได้สูงสุด 25 ช่อง', icon: 'warning', background: '#2b2d31', color: '#dbdee1' }); return; } setEmbedData(prev => ({ ...prev, fields: [...(prev.fields || []), { id: Date.now().toString(), name: "New Field", value: "Value", inline: false }] })); };
    const handleUpdateField = (id: string, key: keyof EmbedField, val: any) => { setEmbedData(prev => ({ ...prev, fields: prev.fields?.map(f => f.id === id ? { ...f, [key]: val } : f) })); };
    const handleRemoveField = (id: string) => { setEmbedData(prev => ({ ...prev, fields: prev.fields?.filter(f => f.id !== id) })); };
    const handleSave = async (e: FormEvent) => { e.preventDefault(); const res = await fetch(`${API_URL}/api/announcements/${guildId}/save_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel_id: selectedChannel, message, use_embed: useEmbed, embed_data: embedData, use_image: useImage, image_data: imageData }), credentials: 'include' }); if (res.ok) { Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', background: '#2b2d31', color: '#dbdee1', timer: 1500 }); setInitialSettings({ isEnabled, selectedChannel, message, useEmbed, embedData, useImage, imageData }); setIsDirty(false); } };
    const handleReset = () => { if (initialSettings) { setIsEnabled(initialSettings.isEnabled); setSelectedChannel(initialSettings.selectedChannel); setMessage(initialSettings.message); setUseEmbed(initialSettings.useEmbed); setEmbedData(initialSettings.embedData); setUseImage(initialSettings.useImage); setImageData(initialSettings.imageData); } };
    const toggleSwitch = async (checked: boolean) => { setIsEnabled(checked); await fetch(`${API_URL}/api/announcements/${guildId}/toggle_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: checked }), credentials: 'include' }); };

    const EmbedPreview = () => {
        const pTitle = previewReplacer(embedData.title, botInfo.avatar, userProfile, guildProfile, true); const pDesc = previewReplacer(embedData.description, botInfo.avatar, userProfile, guildProfile, false); const pAuthorName = previewReplacer(embedData.author_name, botInfo.avatar, userProfile, guildProfile, true); const pAuthorIcon = previewReplacer(embedData.author_icon, botInfo.avatar, userProfile, guildProfile, false); const pFooterText = previewReplacer(embedData.footer_text, botInfo.avatar, userProfile, guildProfile, true); const pFooterIcon = previewReplacer(embedData.footer_icon, botInfo.avatar, userProfile, guildProfile, false); const pThumbnail = previewReplacer(embedData.thumbnail, botInfo.avatar, userProfile, guildProfile, false); const pImage = previewReplacer(embedData.image, botInfo.avatar, userProfile, guildProfile, false); const pMessage = previewReplacer(message, botInfo.avatar, userProfile, guildProfile, false);
        let timeDisplay = currentTime; if (embedData.timestamp_mode === 'custom' && embedData.custom_timestamp) { const d = new Date(embedData.custom_timestamp); if (!isNaN(d.getTime())) timeDisplay = d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }); }
        return (
            <div className="bg-[#313338] p-3 md:p-4 rounded-lg text-[#dbdee1] w-full overflow-hidden border border-[#2e3035] shadow-sm transition-all duration-300">
                 <div className="flex items-start gap-2 md:gap-3 w-full min-w-0">
                    <img src={botInfo.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shrink-0 hover:scale-110 transition-transform duration-300" alt="Bot" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1 md:gap-2 flex-wrap"><span className="font-medium text-white break-words transition-colors hover:text-[#5865f2] cursor-pointer text-sm md:text-base">{botInfo.name}</span><span className="bg-[#5865f2] text-white text-[9px] md:text-[10px] px-1 rounded h-3 md:h-4 flex items-center shrink-0">BOT</span><span className="text-[10px] md:text-xs text-[#949ba4] md:ml-1">{currentTime}</span></div>
                        {pMessage && <div className="mt-1 whitespace-pre-wrap text-[13px] md:text-sm break-words leading-relaxed">{parseMarkdown(pMessage)}</div>}
                        {useEmbed && (
                            <div className="mt-2 bg-[#2b2d31] rounded flex w-full border-l-[3px] md:border-l-4 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5" style={{ borderColor: embedData.color }}>
                                <div className="p-3 md:p-4 flex flex-col gap-1.5 md:gap-2 flex-1 min-w-0 overflow-hidden w-full">
                                    {pAuthorName && (<div className="flex items-center gap-1.5 md:gap-2 text-[13px] md:text-sm font-bold text-white overflow-hidden">{pAuthorIcon && <img src={pAuthorIcon} className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover shrink-0" alt="Icon" />}<span className="break-words">{pAuthorName}</span></div>)}
                                    {pTitle && <div className="font-bold text-white text-[14px] md:text-base break-words">{parseMarkdown(pTitle)}</div>}
                                    {pDesc && <div className="text-[13px] md:text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">{parseMarkdown(pDesc)}</div>}
                                    {embedData.fields && embedData.fields.length > 0 && (<div className="mt-2 flex flex-wrap w-full">{embedData.fields.map((f) => { const pName = previewReplacer(f.name, botInfo.avatar, userProfile, guildProfile, true) || '\u200b'; const pValue = previewReplacer(f.value, botInfo.avatar, userProfile, guildProfile, false) || '\u200b'; return (<div key={f.id} className={`${f.inline ? 'w-[33.33%] pr-3' : 'w-full'} flex flex-col mb-3`}><div className="font-bold text-[13px] md:text-sm text-white break-words">{parseMarkdown(pName)}</div><div className="text-[13px] md:text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">{parseMarkdown(pValue)}</div></div>); })}</div>)}
                                    {pImage && (<div className="mt-1 md:mt-2 w-full flex justify-center bg-black/10 rounded overflow-hidden"><img src={pImage} className="max-w-full h-auto object-contain block hover:scale-105 transition-transform duration-500" alt="Main" /></div>)}
                                    {(pFooterText || embedData.timestamp_mode !== 'none') && (<div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-[#949ba4] mt-1 overflow-hidden opacity-90">{pFooterIcon && <img src={pFooterIcon} className="w-4 h-4 md:w-5 md:h-5 rounded-full shrink-0" alt="Footer" />}<div className="flex items-center gap-1 overflow-hidden">{pFooterText && <span className="break-words">{pFooterText}</span>}{pFooterText && embedData.timestamp_mode !== 'none' && <span className="shrink-0">•</span>}{embedData.timestamp_mode !== 'none' && <span className="shrink-0">{timeDisplay}</span>}</div></div>)}
                                </div>
                                {pThumbnail && <div className="p-3 md:p-4 pl-0 shrink-0 flex items-start"><img src={pThumbnail} className="w-16 h-16 md:w-20 md:h-20 rounded object-cover hover:scale-110 transition-transform duration-300" alt="Thumb" /></div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const globalStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&family=Prompt:wght@300;400;500&family=Mitr:wght@300;400&family=Chakra+Petch:wght@300;400;500&family=Bai+Jamjuree:wght@300;400;500&family=Mali:wght@300;400;500&family=Itim&family=Noto+Sans+Thai:wght@300;400;500;600&display=swap');
        .font-noto { font-family: 'Noto Sans Thai', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f4147; border-radius: 10px; transition: background 0.3s ease; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #5865f2; }
        @keyframes pageLoadFadeUp { 0% { opacity: 0; transform: translateY(20px) scale(0.99); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-page-load { animation: pageLoadFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; } .delay-200 { animation-delay: 200ms; } .delay-300 { animation-delay: 300ms; } .delay-400 { animation-delay: 400ms; }
    `;

    return (
        <div className="flex flex-col pb-32 p-4 md:p-8 min-h-screen max-w-[1920px] mx-auto bg-[#313338]/50 font-noto">
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
            <div className="flex justify-between items-center mb-6 md:mb-10 animate-page-load delay-100">
                <div><h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Welcome Message</h1><p className="text-[#949ba4] mt-1 md:mt-2 text-sm md:text-lg">จัดการระบบทักทายสมาชิกใหม่ของคุณ</p></div>
                <label className="relative inline-flex items-center cursor-pointer scale-[1.1] md:scale-125 mr-2 md:mr-4 group"><input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => toggleSwitch(e.target.checked)} /><div className="relative w-12 h-6 md:w-14 md:h-7 bg-gray-600/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all peer-checked:bg-[#23a559] group-hover:scale-105 transition-transform duration-300"></div></label>
            </div>

            <div className="relative z-[20] bg-[#2b2d31] p-5 md:p-8 rounded-2xl border border-[#1e1f22] mb-6 md:mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-page-load delay-200">
                <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 border-b border-gray-700/50 pb-3 flex items-center gap-2"><Layout className="w-5 h-5 text-[#5865f2]" /> การตั้งค่าทั่วไป</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
                    <div>
                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 md:mb-4 tracking-wide transition-colors hover:text-[#dbdee1]">ส่งไปที่ห้อง (Channel)</label>
                        {/* 📍 Dropdown เลือกห้องแบบ Native ที่มี Scrollbar และชื่อหมวดหมู่กำกับ */}
                        <select 
                            value={selectedChannel} 
                            onChange={(e) => setSelectedChannel(e.target.value)} 
                            className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 md:p-3 rounded-md border border-[#1e1f22] focus:border-[#5865f2] focus:ring-2 focus:ring-[#5865f2]/50 transition-all duration-300 custom-scrollbar cursor-pointer text-sm md:text-base"
                        >
                            <option value="">-- เลือกห้อง --</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>
                                    # {c.name} {c.category ? `| ${c.category}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 md:mb-4 tracking-wide transition-colors hover:text-[#dbdee1]">ข้อความหลัก (Main Message)</label><SmartInput value={message} onChange={setMessage} placeholder="ข้อความทักทาย..." className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 md:p-3 rounded-md border border-[#1e1f22] text-sm md:text-base" maxLength={2000} /></div>
                </div>
            </div>

            <div className="relative z-[10] bg-[#2b2d31] p-5 md:p-8 rounded-2xl border border-[#1e1f22] mb-6 md:mb-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-page-load delay-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-700/50 pb-4 gap-4 sm:gap-0">
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4"><h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-[#5865f2]" /> Embed Message</h2><label className="relative inline-flex items-center cursor-pointer group sm:hidden"><span className="mr-3 text-xs font-medium text-gray-300 transition-colors group-hover:text-white">{useEmbed ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} /><div className="relative w-10 h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div></label></div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end"><button onClick={openHelpModal} className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#1e1f22] hover:bg-[#3f4147] active:scale-95 border border-[#3f4147] px-3 py-1.5 md:py-2 rounded-lg text-[#dbdee1] transition-all duration-300 hover:text-white shadow-sm text-xs font-medium group"><BookOpen className="w-4 h-4 text-[#00b0f4] group-hover:scale-110 transition-transform duration-300" /><span>คู่มือตัวแปร & Markdown <span className="font-mono text-[#5865f2] bg-[#2b2d31] px-1 rounded ml-1 group-hover:bg-[#1e1f22] transition-colors">{`{}`}</span></span></button><label className="hidden sm:inline-flex relative items-center cursor-pointer group"><span className="mr-3 text-sm font-medium text-gray-300 transition-colors group-hover:text-white">{useEmbed ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} /><div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all group-hover:scale-105 transition-transform duration-300"></div></label></div>
                </div>
                <div className={`grid transition-all duration-500 ease-in-out ${useEmbed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                    <div className={useEmbed ? "overflow-visible" : "overflow-hidden"}>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 pt-6">
                            <div className="space-y-4 md:space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4"><div className="flex-1 w-full"><ImageInput label="Author Icon" value={embedData.author_icon} onChange={(v) => handleEmbedChange('author_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div><div className="flex-1 w-full"><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1]">Author Name</label><SmartInput value={embedData.author_name} onChange={(v) => handleEmbedChange('author_name', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 md:p-2.5 rounded-md border border-[#1e1f22] text-sm" placeholder="{user.username}" maxLength={100} /></div></div>
                                <div><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1]">Title</label><SmartInput value={embedData.title} onChange={(v) => handleEmbedChange('title', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 md:p-2.5 rounded-md border border-[#1e1f22] font-bold text-sm" maxLength={100} /></div>
                                <div><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1]">Description</label><SmartInput isTextarea={true} maxLength={300} value={embedData.description} onChange={(v) => handleEmbedChange('description', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 md:p-3 rounded-md border border-[#1e1f22] min-h-[100px] md:min-h-[120px] text-sm" /></div>
                                <div className="flex flex-col sm:flex-row gap-4 items-end"><div className="w-full sm:w-40 shrink-0"><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1]">Color</label><div className="flex gap-2 group h-[38px] md:h-[42px]"><div className="relative w-10 md:w-12 h-full rounded overflow-hidden border border-[#1e1f22] group-hover:border-[#5865f2] shrink-0 hover:scale-105 transition-all duration-300"><DebouncedColorInput value={embedData.color} onChange={(val) => handleEmbedChange('color', val)} className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" /></div><input type="text" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="flex-1 w-full bg-[#1e1f22] text-[#dbdee1] px-2 md:px-2.5 rounded-md border border-[#1e1f22] uppercase font-mono text-sm group-hover:border-[#5865f2] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#5865f2]/50" /></div></div><div className="flex-1 w-full mt-4 sm:mt-0"><ImageInput label="Thumbnail URL" value={embedData.thumbnail} onChange={(v) => handleEmbedChange('thumbnail', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div></div>
                                <div className="w-full pt-2"><ImageInput label="Image URL" value={embedData.image} onChange={(v) => handleEmbedChange('image', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                <div className="border-t border-[#3f4147] pt-6 space-y-6">
                                    <div className="space-y-4">
                                        <label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1"><Columns className="w-3 h-3 md:w-4 md:h-4 text-[#00b0f4]" /> Embed Fields <span className="bg-[#1e1f22] border border-[#3f4147] text-[#949ba4] px-2 py-0.5 rounded-full ml-2 text-[9px] md:text-[10px]">{(embedData.fields || []).length}/25</span></label>
                                        <div className="space-y-4">
                                            {(embedData.fields || []).map((field) => (
                                                <div key={field.id} className="bg-[#1e1f22]/50 p-3 md:p-4 rounded-lg border border-[#3f4147] animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 md:gap-4 relative group hover:border-[#5865f2]/50 transition-colors">
                                                    <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><button type="button" onClick={() => handleRemoveField(field.id)} className="text-red-400 hover:text-red-500 hover:bg-red-400/10 p-1.5 rounded transition-colors active:scale-90"><Trash2 className="w-4 h-4" /></button></div>
                                                    <div className="flex gap-3 md:gap-4 items-center pr-8 md:pr-10">
                                                        <div className="flex-1"><label className="block text-[#949ba4] text-[9px] md:text-[10px] uppercase mb-1 font-bold">Name (Max 256)</label><SmartInput value={field.name} onChange={v => handleUpdateField(field.id, 'name', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#3f4147] text-xs md:text-sm focus:border-[#5865f2] transition-colors" maxLength={256} /></div>
                                                        <div className="shrink-0 flex flex-col items-center"><label className="block text-[#949ba4] text-[9px] md:text-[10px] uppercase mb-1.5 font-bold">Inline</label><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={field.inline} onChange={e => handleUpdateField(field.id, 'inline', e.target.checked)} /><div className="w-8 h-4 md:w-9 md:h-5 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 md:after:h-4 md:after:w-4 after:transition-all"></div></label></div>
                                                    </div>
                                                    <div><label className="block text-[#949ba4] text-[9px] md:text-[10px] uppercase mb-1 font-bold">Value (Max 1024)</label><SmartInput isTextarea value={field.value} onChange={v => handleUpdateField(field.id, 'value', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#3f4147] text-xs md:text-sm min-h-[50px] md:min-h-[60px] focus:border-[#5865f2] transition-colors" maxLength={1024} /></div>
                                                </div>
                                            ))}
                                            {(embedData.fields?.length === 0 || !embedData.fields) && (<div className="text-center p-4 md:p-6 border-2 border-dashed border-[#3f4147] rounded-lg text-[#949ba4] text-[10px] md:text-xs">ยังไม่มีฟิลด์ กดปุ่ม Add Field ด้านล่างเพื่อเพิ่มข้อมูล</div>)}
                                        </div>
                                        <button onClick={handleAddField} type="button" className="flex w-full items-center justify-center gap-2 text-[10px] md:text-xs bg-[#1e1f22] hover:bg-[#3f4147] active:scale-[0.99] border border-[#3f4147] text-[#dbdee1] hover:text-white py-2.5 md:py-3 rounded-lg transition-all shadow-sm group font-medium mt-2"><Plus className="w-4 h-4 text-[#23a559] group-hover:scale-125 transition-transform" /> เพิ่มฟิลด์ใหม่ (Add Field)</button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#3f4147]"><div className="flex-1 w-full"><ImageInput label="Footer Icon" value={embedData.footer_icon} onChange={(v) => handleEmbedChange('footer_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div><div className="flex-1 w-full"><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1]">Footer Text</label><SmartInput value={embedData.footer_text} onChange={(v) => handleEmbedChange('footer_text', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 md:p-2.5 rounded-md border border-[#1e1f22] text-sm" maxLength={100} /></div></div>
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-[#1e1f22]/30 p-3 md:p-4 rounded-lg border border-[#3f4147]/50"><div className="w-full sm:w-1/3 shrink-0"><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1] flex items-center gap-1"><Clock className="w-3 h-3 text-[#00b0f4]" /> Timestamp</label><select value={embedData.timestamp_mode} onChange={(e) => handleEmbedChange('timestamp_mode', e.target.value as any)} className="w-full bg-[#1e1f22] text-white p-2 md:p-2.5 rounded-md border border-[#3f4147] focus:border-[#5865f2] text-sm focus:ring-2 focus:ring-[#5865f2]/50 transition-all duration-300 cursor-pointer custom-scrollbar"><option value="none">ปิด (Off)</option><option value="current">เวลาปัจจุบัน</option><option value="custom">กำหนดเอง</option></select></div>{embedData.timestamp_mode === 'custom' && (<div className="flex-1 w-full animate-in fade-in slide-in-from-left-4 duration-300 mt-2 sm:mt-0"><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 tracking-wide transition-colors hover:text-[#dbdee1]">เลือกวันและเวลา</label><input type="datetime-local" value={embedData.custom_timestamp} onChange={(e) => handleEmbedChange('custom_timestamp', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 md:p-2.5 rounded-md border border-[#3f4147] focus:border-[#5865f2] text-sm focus:ring-2 focus:ring-[#5865f2]/50 transition-all duration-300" /></div>)}</div>
                                </div>
                            </div>
                            <div className="relative w-full h-full mt-4 xl:mt-0"><div className="sticky top-4 md:top-6 z-10"><div className="flex items-center justify-between mb-2 w-full lg:max-w-2xl"><h3 className="text-[#949ba4] text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1 md:gap-2"><Layers className="w-4 h-4"/> Embed Preview</h3><span className="text-[9px] md:text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full animate-pulse">● Live Update</span></div><div className="w-full lg:max-w-2xl animate-in fade-in zoom-in-95 duration-500"><EmbedPreview /></div></div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Welcome Image Settings */}
            <div className="relative z-[5] bg-[#2b2d31] p-5 md:p-8 rounded-2xl border border-[#1e1f22] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-page-load delay-400">
                <div className="flex items-center justify-between border-b border-gray-700/50 pb-4">
                    <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-[#5865f2]" /> Welcome Image</h2>
                    <label className="relative inline-flex items-center cursor-pointer group"><span className="mr-2 md:mr-3 text-xs md:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{useImage ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useImage} onChange={(e) => setUseImage(e.target.checked)} /><div className="relative w-10 h-5 md:w-11 md:h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all group-hover:scale-105 transition-transform duration-300"></div></label>
                </div>
                <div className={`grid transition-all duration-500 ease-in-out ${useImage ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                    <div className={useImage ? "overflow-visible" : "overflow-hidden"}>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 pt-6">
                            <div className="space-y-4 md:space-y-6">
                                <div className="bg-[#1e1f22] p-4 md:p-5 rounded-lg border border-[#3f4147] shadow-inner hover:border-[#5865f2]/50 transition-colors duration-300">
                                    <label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 md:mb-3 flex items-center gap-2 transition-colors hover:text-[#dbdee1]"><Type className="w-4 h-4" /> เลือกแบบอักษร (Font)</label>
                                    {/* 📍 Dropdown เลือกฟอนต์แบบ Native ที่แสดง Preview ฟอนต์ในแต่ละตัวเลือก */}
                                    <select 
                                        value={imageData.font_name} 
                                        onChange={(e) => handleImageChange('font_name', e.target.value)} 
                                        className="w-full bg-[#2b2d31] text-white p-2.5 rounded-md border border-[#3f4147] focus:border-[#5865f2] focus:ring-2 focus:ring-[#5865f2]/50 transition-all duration-300 cursor-pointer custom-scrollbar text-sm"
                                        style={{ fontFamily: imageData.font_name.replace('.ttf', '').replace('.otf', '').split('-')[0] }}
                                    >
                                        <option value="Default">Default</option>
                                        {availableFonts.map(f => {
                                            const cleanName = f.replace('.ttf', '').replace('.otf', '');
                                            const family = cleanName.split('-')[0];
                                            return (
                                                <option key={f} value={f} style={{ fontFamily: family }}>
                                                    {cleanName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="w-full"><ImageInput label="URL พื้นหลัง (Background Image)" value={imageData.bg_url} onChange={(v) => handleImageChange('bg_url', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                <div className="space-y-4 md:space-y-6 bg-[#1e1f22] p-4 md:p-6 rounded-lg border border-[#3f4147] shadow-inner hover:border-[#5865f2]/50 transition-colors duration-300"><h3 className="text-white text-xs md:text-sm font-bold border-b border-gray-700 pb-2 flex items-center gap-2"><Info className="w-4 h-4 text-yellow-500" /> ตั้งค่าข้อความบนภาพ</h3><div className="space-y-3 md:space-y-4 pt-2"><div className="flex gap-2 md:gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[9px] md:text-[10px] font-bold uppercase mb-1 transition-colors hover:text-[#dbdee1]">บรรทัดที่ 1 (Title)</label><SmartInput value={imageData.image_title} onChange={(v) => handleImageChange('image_title', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147] text-sm" maxLength={30} /></div><div className="relative w-10 h-[38px] rounded border border-[#3f4147] hover:border-[#5865f2] overflow-hidden hover:scale-105 transition-all duration-300 shrink-0"><DebouncedColorInput value={imageData.title_color} onChange={(val) => handleImageChange('title_color', val)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" /></div></div><div className="flex gap-2 md:gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[9px] md:text-[10px] font-bold uppercase mb-1 transition-colors hover:text-[#dbdee1]">บรรทัดที่ 2 (Username)</label><SmartInput value={imageData.image_username} onChange={(v) => handleImageChange('image_username', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147] text-sm" maxLength={32} /></div><div className="relative w-10 h-[38px] rounded border border-[#3f4147] hover:border-[#5865f2] overflow-hidden hover:scale-105 transition-all duration-300 shrink-0"><DebouncedColorInput value={imageData.username_color} onChange={(val) => handleImageChange('username_color', val)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" /></div></div><div className="flex gap-2 md:gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[9px] md:text-[10px] font-bold uppercase mb-1 transition-colors hover:text-[#dbdee1]">บรรทัดที่ 3 (Sub-Text)</label><SmartInput value={imageData.text_content} onChange={(v) => handleImageChange('text_content', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147] text-sm" maxLength={50} /></div><div className="relative w-10 h-[38px] rounded border border-[#3f4147] hover:border-[#5865f2] overflow-hidden hover:scale-105 transition-all duration-300 shrink-0"><DebouncedColorInput value={imageData.message_color} onChange={(val) => handleImageChange('message_color', val)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" /></div></div></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"><div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-3 transition-colors hover:text-[#dbdee1]">Avatar Shape</label><div className="flex bg-[#1e1f22] rounded p-1 border border-[#3f4147]"><button type="button" onClick={() => handleImageChange('avatar_shape', 'circle')} className={`flex-1 py-1.5 text-xs rounded transition-all duration-300 hover:scale-[1.02] active:scale-95 ${imageData.avatar_shape === 'circle' ? 'bg-[#5865f2] text-white shadow-md' : 'text-gray-400 hover:bg-[#2b2d31]'}`}>Circle</button><button type="button" onClick={() => handleImageChange('avatar_shape', 'square')} className={`flex-1 py-1.5 text-xs rounded transition-all duration-300 hover:scale-[1.02] active:scale-95 ${imageData.avatar_shape === 'square' ? 'bg-[#5865f2] text-white shadow-md' : 'text-gray-400 hover:bg-[#2b2d31]'}`}>Square</button></div></div><div><label className="block text-[#b5bac1] text-[10px] md:text-xs font-bold uppercase mb-2 md:mb-3 flex justify-between transition-colors hover:text-[#dbdee1]">Overlay Opacity <span>{imageData.overlay_opacity}%</span></label><input type="range" min="0" max="100" value={imageData.overlay_opacity} onChange={(e) => handleImageChange('overlay_opacity', Number(e.target.value))} className="w-full h-2 mt-2 bg-[#1e1f22] rounded appearance-none cursor-pointer accent-[#5865f2] hover:scale-[1.01] transition-transform duration-300" /></div></div><div className="grid grid-cols-3 gap-2 md:gap-4"><div><label className="block text-[#b5bac1] text-[9px] md:text-[10px] font-bold uppercase mb-1 transition-colors hover:text-[#dbdee1]">Position</label><select value={imageData.image_position} onChange={(e) => handleImageChange('image_position', e.target.value as any)} className="w-full bg-[#1e1f22] text-white p-1.5 md:p-2 rounded border border-[#3f4147] text-[10px] md:text-xs focus:border-[#5865f2] focus:ring-2 focus:ring-[#5865f2]/50 transition-all duration-300 cursor-pointer"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="text">Text Only</option></select></div><div><label className="block text-[#b5bac1] text-[9px] md:text-[10px] font-bold uppercase mb-1 transition-colors hover:text-[#dbdee1]">Circle Color</label><div className="relative w-full h-[32px] md:h-[38px] rounded border border-[#3f4147] hover:border-[#5865f2] overflow-hidden hover:scale-105 transition-all duration-300 shrink-0"><DebouncedColorInput value={imageData.circle_color} onChange={(val) => handleImageChange('circle_color', val)} className="absolute -top-2 -left-2 w-full h-14 cursor-pointer scale-150" /></div></div><div><label className="block text-[#b5bac1] text-[9px] md:text-[10px] font-bold uppercase mb-1 transition-colors hover:text-[#dbdee1]">Overlay Color</label><div className="relative w-full h-[32px] md:h-[38px] rounded border border-[#3f4147] hover:border-[#5865f2] overflow-hidden hover:scale-105 transition-all duration-300 shrink-0"><DebouncedColorInput value={imageData.overlay_color} onChange={(val) => handleImageChange('overlay_color', val)} className="absolute -top-2 -left-2 w-full h-14 cursor-pointer scale-150" /></div></div></div></div><div className="relative w-full h-full mt-4 xl:mt-0"><div className="sticky top-4 md:top-6 z-10"><div className="flex items-center justify-between mb-2 w-full lg:max-w-2xl"><h3 className="text-[#949ba4] text-[10px] md:text-xs font-bold uppercase tracking-wide flex items-center gap-1 md:gap-2"><ImageIcon className="w-3 h-3 md:w-4 md:h-4" /> Live Preview Image</h3><span className="text-[9px] md:text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full animate-pulse">● Live Update</span></div><div className="w-full lg:max-w-2xl animate-in fade-in zoom-in-95 duration-500"><ImagePreview imageData={imageData} botInfo={botInfo} userProfile={userProfile} guildProfile={guildProfile} guildId={guildId} API_URL={API_URL} /></div></div></div></div></div></div></div>

            <div className={`fixed bottom-0 left-0 right-0 p-4 md:p-6 lg:ml-64 flex justify-center items-center transition-all duration-500 transform pointer-events-none ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-[70]`}><div className="pointer-events-auto bg-[#111214]/95 backdrop-blur-md border border-[#2b2d31] p-3 md:p-4 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-500"><span className="text-white font-medium flex items-center gap-2 pl-2 text-sm md:text-base"><span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span><div className="flex gap-2 sm:gap-3 w-full sm:w-auto"><button type="button" onClick={handleReset} className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-[#dbdee1] hover:text-white px-3 md:px-4 py-2 rounded hover:bg-[#2b2d31] transition-all duration-300 hover:scale-105 active:scale-95 font-medium text-xs md:text-sm bg-[#1e1f22] sm:bg-transparent"><RotateCcw className="w-3 h-3 md:w-4 md:h-4" /> Reset</button><button type="submit" onClick={handleSave} className="flex-1 sm:flex-none justify-center bg-[#23a559] hover:bg-[#1f934e] text-white font-bold py-2 px-4 md:px-6 rounded-full shadow-lg hover:shadow-[#23a559]/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center gap-2 text-xs md:text-sm"><Save className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง (Save)</span><span className="sm:hidden">บันทึก</span></button></div></div></div>

            {isHelpModalMounted && (<div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isHelpModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={closeHelpModal}><div className={`bg-[#2b2d31] border border-[#1e1f22] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden transition-all duration-300 ease-out transform ${isHelpModalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`} onClick={e => e.stopPropagation()}><div className="p-4 md:p-6 border-b border-[#1e1f22] flex justify-between items-center bg-[#232428] shrink-0"><h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2"><span className="font-mono bg-[#1e1f22] px-2 py-1 rounded text-[#5865f2] shadow-sm">{`{}`}</span> คู่มือ & Markdown</h3><button onClick={closeHelpModal} className="text-[#949ba4] hover:text-white hover:bg-[#3f4147] p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-90"><svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div><div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 md:space-y-8"><section><h4 className="text-white font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Layers className="w-4 h-4 md:w-5 md:h-5 text-[#23a559]" /> ตัวแปรที่ใช้ได้ (Variables)</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">{AVAILABLE_VARS.map((v, i) => (<div key={v.name} className={`bg-[#1e1f22] p-2 md:p-3 rounded-lg border border-[#3f4147] flex flex-col gap-1 hover:border-[#5865f2] hover:shadow-md transition-all duration-500 ease-out transform ${isHelpModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${i * 30}ms` }}><span className="font-mono text-[#dbdee1] font-bold text-xs md:text-sm bg-[#2b2d31] px-2 py-0.5 rounded w-fit">{`{${v.name}}`}</span><span className="text-[#949ba4] text-[10px] md:text-xs">{v.desc}</span></div>))}</div></section><section><h4 className="text-white font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Type className="w-4 h-4 md:w-5 md:h-5 text-[#00b0f4]" /> การจัดรูปแบบข้อความ (Discord Markdown)</h4><div className={`bg-[#1e1f22] rounded-lg border border-[#3f4147] overflow-x-auto hover:border-[#5865f2]/50 transition-all duration-500 ease-out transform shadow-sm ${isHelpModalVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}><table className="w-full text-left text-xs md:text-sm min-w-[400px]"><thead className="bg-[#232428] border-b border-[#3f4147] text-[#949ba4]"><tr><th className="p-2 md:p-3 font-semibold w-1/2">พิมพ์แบบนี้</th><th className="p-2 md:p-3 font-semibold w-1/2">ผลลัพธ์ที่ได้</th></tr></thead><tbody className="text-[#dbdee1] divide-y divide-[#3f4147]"><tr className="hover:bg-[#2b2d31] transition-colors"><td className="p-2 md:p-3 font-mono">**ตัวหนา**</td><td className="p-2 md:p-3"><strong>ตัวหนา</strong></td></tr><tr className="hover:bg-[#2b2d31] transition-colors"><td className="p-2 md:p-3 font-mono">*ตัวเอียง* หรือ _ตัวเอียง_</td><td className="p-2 md:p-3"><em className="italic">ตัวเอียง</em></td></tr><tr className="hover:bg-[#2b2d31] transition-colors"><td className="p-2 md:p-3 font-mono">__ขีดเส้นใต้__</td><td className="p-2 md:p-3"><u className="underline">ขีดเส้นใต้</u></td></tr><tr className="hover:bg-[#2b2d31] transition-colors"><td className="p-2 md:p-3 font-mono">~~ขีดทับ~~</td><td className="p-2 md:p-3"><s className="line-through">ขีดทับ</s></td></tr><tr className="hover:bg-[#2b2d31] transition-colors"><td className="p-2 md:p-3 font-mono">`โค้ด`</td><td className="p-2 md:p-3"><code className="bg-[#2b2d31] px-1.5 py-0.5 rounded font-mono">โค้ด</code></td></tr><tr className="hover:bg-[#2b2d31] transition-colors"><td className="p-2 md:p-3 font-mono">[ชื่อลิงก์](https://...)</td><td className="p-2 md:p-3"><a href="#" className="text-[#00b0f4] hover:underline" onClick={e=>e.preventDefault()}>ชื่อลิงก์</a></td></tr></tbody></table></div></section></div></div></div>)}
        </div>
    );
}