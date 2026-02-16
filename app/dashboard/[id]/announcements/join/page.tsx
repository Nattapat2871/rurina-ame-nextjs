"use client";

import { useEffect, useState, useRef, ChangeEvent, MouseEvent, FormEvent, memo } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Save, RotateCcw, Image as ImageIcon, Layout, Type, Layers, Palette, Info } from 'lucide-react';

// --- 🟦 TypeScript Interfaces ---
interface UserProfile {
    username: string;
    global_name: string;
    id: string;
    avatar: string;
}

interface GuildProfile {
    name: string;
    id: string;
    icon: string;
    approximate_member_count?: number;
    member_count?: number;
}

interface Channel {
    id: string;
    name: string;
}

interface BotInfo {
    name: string;
    avatar: string;
}

interface EmbedData {
    author_name: string;
    author_icon: string;
    title: string;
    description: string;
    url: string;
    color: string;
    thumbnail: string;
    image: string;
    footer_text: string;
    footer_icon: string;
    timestamp_mode: 'none' | 'current' | 'custom';
    custom_timestamp: string;
}

interface ImageData {
    bg_url: string;
    image_title: string;
    image_username: string;
    text_content: string;
    font_name: string;
    avatar_shape: 'circle' | 'square';
    overlay_opacity: number;
    image_position: 'left' | 'center' | 'right' | 'text';
    title_color: string;
    username_color: string;
    message_color: string;
    circle_color: string;
    overlay_color: string;
}

interface SmartInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    isTextarea?: boolean;
    maxLength?: number;
    showCounter?: boolean;
}

interface ImageInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    botAvatar: string;
    userReal: UserProfile | null;
    guildReal: GuildProfile | null;
}

interface JoinSettings {
    isEnabled: boolean;
    selectedChannel: string;
    message: string;
    useEmbed: boolean;
    embedData: EmbedData;
    useImage: boolean;
    imageData: ImageData;
}

interface ImagePreviewProps {
    imageData: ImageData;
    botInfo: BotInfo;
    userProfile: UserProfile | null;
    guildProfile: GuildProfile | null;
    guildId: string | string[];
    API_URL: string;
}

// --- 📜 Available Variables ---
const AVAILABLE_VARS = [
    { name: "user", desc: "แท็กผู้ใช้ (@GlobalName)" },
    { name: "user.username", desc: "ชื่อผู้ใช้จริง (Username)" },
    { name: "user.global_name", desc: "ชื่อที่แสดง (Global Name)" },
    { name: "user.id", desc: "ไอดีผู้ใช้" },
    { name: "user.avatar", desc: "ลิงก์รูปโปรไฟล์" },
    { name: "server.name", desc: "ชื่อเซิร์ฟเวอร์" },
    { name: "server.id", desc: "ไอดีเซิร์ฟเวอร์" },
    { name: "server.icon", desc: "ลิงก์ไอคอนเซิร์ฟเวอร์" },
    { name: "membercount", desc: "จำนวนสมาชิก" },
    { name: "membercount.ordinal", desc: "ลำดับสมาชิก (ex. 17th)" },
    { name: "#channel_name", desc: "แท็กห้อง (ใส่ชื่อ/ID ใน {})" },
    { name: "@role_name", desc: "แท็กยศ (ใส่ชื่อ/ID ใน {})" },
    { name: ":emoji_name", desc: "ใส่อิโมจิ (ใส่ชื่อ/ID ใน {})" }
];

// --- 🧠 SmartInput Component (Optimized) ---
const SmartInput = memo(({ value, onChange, placeholder, className, isTextarea = false, maxLength, showCounter = true }: SmartInputProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.value;
        onChange(val);
        const cursor = e.target.selectionStart;
        if (cursor === null) return;
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z0-9._@#:]*)$/);
        if (match) { setShowMenu(true); setFilter(match[1].toLowerCase()); } else { setShowMenu(false); }
    };

    const insertVar = (varName: string) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart;
        if (cursor === null) return;
        const textBeforeCursor = value.slice(0, cursor);
        const textAfterCursor = value.slice(cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z0-9._@#:]*)$/);
        if (match) {
            const startPos = cursor - match[1].length - 1;
            const newText = value.slice(0, startPos) + `{${varName}}` + textAfterCursor;
            if (maxLength && newText.length > maxLength) return;
            onChange(newText);
            setShowMenu(false);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const newCursorPos = startPos + varName.length + 2;
                    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
            }, 0);
        }
    };

    return (
        <div className="relative w-full">
            {showCounter && maxLength && (
                <div className={`absolute -top-5 right-0 text-[10px] font-mono select-none pointer-events-none transition-colors duration-150 ${value.length >= maxLength ? 'text-red-500 font-bold' : 'text-[#949ba4]'}`}>
                    {value.length}/{maxLength}
                </div>
            )}
            {isTextarea ? (
                <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} value={value} onChange={handleChange} className={`transition-all duration-200 focus:outline-none ${className}`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            ) : (
                <input ref={inputRef as React.RefObject<HTMLInputElement>} type="text" value={value} onChange={handleChange} className={`transition-all duration-200 focus:outline-none ${className}`} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            )}
            {showMenu && (
                <div className="absolute z-50 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-2xl mt-2 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar animate-in fade-in zoom-in-95 duration-100" style={{ top: '100%', left: 0 }}>
                    {AVAILABLE_VARS.filter(v => v.name.toLowerCase().includes(filter)).map(v => (
                        <div key={v.name} onMouseDown={(e: MouseEvent<HTMLDivElement>) => { e.preventDefault(); insertVar(v.name); }} className="px-3 py-2 hover:bg-[#404249] cursor-pointer flex justify-between items-center transition-colors border-b border-[#1e1f22]/50 last:border-0">
                            <span className="font-bold text-[#dbdee1] font-mono text-xs">{`{${v.name}}`}</span>
                            <span className="text-[#949ba4] text-[10px] bg-[#1e1f22] px-2 py-0.5 rounded-full">{v.desc}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

// --- Helper Functions ---
const parseMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\]\([^)]+\)|<@[^>]+>|<#[^>]+>|:\d+:)/g);
    return parts.map((part, index) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#00b0f4] hover:underline cursor-pointer break-words">{linkMatch[1]}</a>;
        
        const mentionMatch = part.match(/^<@([^>]+)>$/);
        if (mentionMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium inline-block break-words cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors duration-150">@{mentionMatch[1]}</span>;
        
        const channelMatch = part.match(/^<#([^>]+)>$/);
        if (channelMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium inline-block break-words cursor-pointer hover:bg-[#5865f2] hover:text-white transition-colors duration-150">#{channelMatch[1]}</span>;
        
        const emojiMatch = part.match(/^:(\d+):$/);
        if (emojiMatch) return <img key={index} src={`https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`} className="w-5 h-5 inline-block align-middle mx-[2px] object-contain" alt="emoji"/>;
        return part;
    });
};

const previewReplacer = (text: string, botAvatar: string, userReal: UserProfile | null, guildReal: GuildProfile | null, isTextOnly: boolean = false): string => {
    if (!text) return "";
    let msg = text;
    const realUsername = userReal?.username || "username"; 
    const globalName = userReal?.global_name || realUsername;
    const userMention = isTextOnly ? globalName : `<@${globalName}>`; 
    const userId = userReal?.id || "123456789012345678";
    const userAvatarUrl = userReal?.avatar ? `https://cdn.discordapp.com/avatars/${userReal.id}/${userReal.avatar}.${userReal?.avatar?.startsWith("a_") ? "gif" : "png"}?size=256` : "https://cdn.discordapp.com/embed/avatars/0.png";
    const serverName = guildReal?.name || "My Awesome Server";
    const serverId = guildReal?.id || "987654321098765432";
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
        if (value.includes("{")) {
            setPreview(previewReplacer(value, botAvatar, userReal, guildReal, true));
            return;
        }
        const img = new Image();
        img.src = value;
        img.onload = () => setPreview(value);
        img.onerror = () => setPreview(""); 
    }, [value, botAvatar, userReal, guildReal]);

    return (
        <div className="mb-4">
            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 tracking-wide">{label}</label>
            <div className="flex gap-2">
                <SmartInput value={value} onChange={onChange} placeholder="https://... หรือ {user.avatar}" className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded-md border border-[#1e1f22] text-sm hover:border-[#3f4147] transition-all" maxLength={500} showCounter={false} />
                {preview && (
                    <div className="relative group shrink-0">
                        <img src={preview} className="w-10 h-10 rounded-md object-cover border border-[#1e1f22] shadow-sm group-hover:scale-110 transition-transform cursor-pointer" alt="Preview" />
                    </div>
                )}
            </div>
        </div>
    );
});

// --- 🔥 Image Preview Component ---
const ImagePreview = ({ imageData, botInfo, userProfile, guildProfile, guildId, API_URL }: ImagePreviewProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        setIsLoading(true);
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
                if (res.ok && !isCancelled) {
                    const blob = await res.blob();
                    const newUrl = URL.createObjectURL(blob);
                    setPreviewUrl(prev => { if(prev) URL.revokeObjectURL(prev); return newUrl; });
                }
            } catch (e) { console.error(e); } finally { if(!isCancelled) setIsLoading(false); }
        }, 800);
        return () => { isCancelled = true; clearTimeout(timer); };
    }, [imageData, userProfile, guildProfile, guildId, API_URL, botInfo.avatar]);

    return (
        <div className="relative w-full rounded-xl overflow-hidden border border-[#1e1f22] shadow-2xl bg-[#1a1b1e]">
             <div className="aspect-[1000/480] w-full relative bg-[#232428]">
                {previewUrl ?
                    (<img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />) :
                    (<div className="absolute inset-0 flex flex-col items-center justify-center text-[#949ba4] animate-pulse">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-xs font-mono">RENDERING PREVIEW...</span>
                    </div>)
                }
                {isLoading && previewUrl && (
                    <div className="absolute top-2 right-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></div>
                )}
             </div>
        </div>
    );
};

export default function JoinSettingsPage() {
    const params = useParams();
    const guildId = params.id as string;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const [channels, setChannels] = useState<Channel[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
    const [guildProfile, setGuildProfile] = useState<GuildProfile | null>(null);
    const [availableFonts, setAvailableFonts] = useState<string[]>(["Default"]);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [message, setMessage] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [botInfo, setBotInfo] = useState<BotInfo>({ name: "Bot", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime("Today at " + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // --- State Management ---
    const [useEmbed, setUseEmbed] = useState(false);
    const [embedData, setEmbedData] = useState<EmbedData>({
        author_name: "", author_icon: "", title: "", description: "", url: "", color: "#5865f2",
        thumbnail: "", image: "", footer_text: "", footer_icon: "", 
        timestamp_mode: "none", custom_timestamp: "" 
    });
    const [useImage, setUseImage] = useState(false);
    const [imageData, setImageData] = useState<ImageData>({
        bg_url: "", image_title: "WELCOME", image_username: "{user.username}", text_content: "Welcome to {server.name}!",
        font_name: "Default", avatar_shape: "circle", overlay_opacity: 50, image_position: "left",
        title_color: "#FFFFFF", username_color: "#00FFFF", message_color: "#FFFFFF", circle_color: "#FFFFFF", overlay_color: "#000000"
    });

    const [initialSettings, setInitialSettings] = useState<JoinSettings | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [me, bot, list, fonts, status] = await Promise.all([
                fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).then(r=>r.json()),
                fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(r=>r.json()),
                fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' }).then(r=>r.json()),
                fetch(`${API_URL}/api/announce/list_fonts`, { credentials: 'include' }).then(r=>r.json()),
                fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' }).then(r=>r.json())
            ]);
            if(!me.error) setUserProfile(me);
            setChannels(bot.channels || []);
            if(Array.isArray(list)) { const g = list.find((g: any) => g.id === guildId); if(g) setGuildProfile(g); }
            if(fonts.fonts) setAvailableFonts(fonts.fonts);
            const fetched: JoinSettings = {
                isEnabled: status.is_welcome_enabled || false,
                selectedChannel: status.welcome_channel_id || "",
                message: status.welcome_message || "",
                useEmbed: status.use_embed || false,
                embedData: { ...embedData, ...(status.embed_data || {}) },
                useImage: status.use_image || false,
                imageData: { ...imageData, ...(status.image_data || {}) }
            };
            if(status.bot_avatar) setBotInfo({ name: status.bot_name || "Bot", avatar: status.bot_avatar });
            setIsEnabled(fetched.isEnabled); setSelectedChannel(fetched.selectedChannel);
            setMessage(fetched.message); setUseEmbed(fetched.useEmbed); setEmbedData(fetched.embedData);
            setUseImage(fetched.useImage); setImageData(fetched.imageData); setInitialSettings(fetched);
        }; fetchData();
    }, [guildId, API_URL]);

    useEffect(() => {
        if (!initialSettings) return;
        const current = { isEnabled, selectedChannel, message, useEmbed, embedData, useImage, imageData };
        setIsDirty(JSON.stringify(current) !== JSON.stringify(initialSettings));
    }, [isEnabled, selectedChannel, message, useEmbed, embedData, useImage, imageData, initialSettings]);

    const handleEmbedChange = (key: keyof EmbedData, value: string) => setEmbedData(prev => ({ ...prev, [key]: value }));
    const handleImageChange = (key: keyof ImageData, value: string | number) => setImageData(prev => ({ ...prev, [key]: value }));

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        const payload = { channel_id: selectedChannel, message, use_embed: useEmbed, embed_data: embedData, use_image: useImage, image_data: imageData };
        const res = await fetch(`${API_URL}/api/announcements/${guildId}/save_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
        if (res.ok) {
            Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', background: '#2b2d31', color: '#dbdee1', timer: 1500 });
            setInitialSettings({ isEnabled, selectedChannel, message, useEmbed, embedData, useImage, imageData });
            setIsDirty(false);
        }
    };

    // 🔥 เพิ่มฟังก์ชัน handleReset ที่ตกหล่น
    const handleReset = () => {
        if (initialSettings) {
            setIsEnabled(initialSettings.isEnabled);
            setSelectedChannel(initialSettings.selectedChannel);
            setMessage(initialSettings.message);
            setUseEmbed(initialSettings.useEmbed);
            setEmbedData(initialSettings.embedData);
            setUseImage(initialSettings.useImage);
            setImageData(initialSettings.imageData);
        }
    };

    const toggleSwitch = async (checked: boolean) => {
        setIsEnabled(checked);
        await fetch(`${API_URL}/api/announcements/${guildId}/toggle_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: checked }), credentials: 'include' });
    };

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

        let timeDisplay = currentTime;
        if (embedData.timestamp_mode === 'custom' && embedData.custom_timestamp) {
            const d = new Date(embedData.custom_timestamp);
            if (!isNaN(d.getTime())) timeDisplay = d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        }

        return (
            <div className="bg-[#313338] p-4 rounded-lg font-sans text-[#dbdee1] w-full overflow-hidden border border-[#2e3035] shadow-sm">
                 <div className="flex items-start gap-3 w-full min-w-0">
                    <img src={botInfo.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="Bot" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            {/* 🔥 แสดงชื่อบอทจริง พร้อม Hover underline */}
                            <span className="font-medium text-white break-words hover:underline cursor-pointer transition-all">{botInfo.name}</span>
                            <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded h-4 flex items-center shrink-0">BOT</span>
                            <span className="text-xs text-[#949ba4] ml-1">{currentTime}</span>
                        </div>
                        {pMessage && <div className="mt-1 whitespace-pre-wrap text-sm break-words leading-relaxed">{parseMarkdown(pMessage)}</div>}
                        {useEmbed && (
                            <div className="mt-2 bg-[#2b2d31] rounded flex w-full border-l-4 overflow-hidden shadow-md" style={{ borderColor: embedData.color }}>
                                <div className="p-4 flex flex-col gap-2 flex-1 min-w-0 overflow-hidden">
                                    {pAuthorName && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-white overflow-hidden">
                                            {pAuthorIcon && <img src={pAuthorIcon} className="w-6 h-6 rounded-full object-cover shrink-0" alt="Icon" />}
                                            <span className="break-words hover:underline cursor-pointer">{pAuthorName}</span>
                                        </div>
                                    )}
                                    {pTitle && <div className="font-bold text-white text-base break-words hover:underline cursor-pointer">{parseMarkdown(pTitle)}</div>}
                                    {pDesc && <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words leading-relaxed">{parseMarkdown(pDesc)}</div>}
                                    {pImage && (
                                        <div className="mt-2 w-full flex justify-center bg-black/10 rounded overflow-hidden">
                                            <img src={pImage} className="max-w-full h-auto object-contain block" alt="Main" />
                                        </div>
                                    )}
                                    {(pFooterText || embedData.timestamp_mode !== 'none') && (
                                        <div className="flex items-center gap-2 text-xs text-[#949ba4] mt-1 overflow-hidden opacity-90">
                                            {pFooterIcon && <img src={pFooterIcon} className="w-5 h-5 rounded-full shrink-0" alt="Footer" />}
                                            <div className="flex items-center gap-1 overflow-hidden">
                                                {pFooterText && <span className="break-words">{pFooterText}</span>}
                                                {pFooterText && embedData.timestamp_mode !== 'none' && <span className="shrink-0">•</span>}
                                                {embedData.timestamp_mode !== 'none' && <span className="shrink-0">{timeDisplay}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {pThumbnail && <div className="p-4 pl-0 shrink-0 flex items-start"><img src={pThumbnail} className="w-20 h-20 rounded object-cover" alt="Thumb" /></div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col pb-32 p-8 min-h-screen max-w-[1920px] mx-auto bg-[#313338]/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Welcome Message</h1>
                    <p className="text-[#949ba4] mt-2 text-lg">จัดการระบบทักทายสมาชิกใหม่ของคุณ</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-125 mr-4 group">
                    <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => toggleSwitch(e.target.checked)} />
                    <div className="relative w-14 h-7 bg-gray-600/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#23a559]"></div>
                </label>
            </div>

            {/* General Settings */}
            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22] mb-8 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-4 flex items-center gap-2"><Layout className="w-5 h-5 text-[#5865f2]" /> การตั้งค่าทั่วไป</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-4 tracking-wide">ส่งไปที่ห้อง (Channel)</label>
                        <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded-md border border-[#1e1f22] focus:border-[#5865f2] transition-all">
                            <option value="">-- เลือกห้อง --</option>
                            {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-4 tracking-wide">ข้อความหลัก (Main Message)</label>
                        <SmartInput value={message} onChange={setMessage} placeholder="ข้อความทักทาย..." className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded-md border border-[#1e1f22]" maxLength={2000} />
                    </div>
                </div>
            </div>

            {/* Embed Settings (50/50 Layout) */}
            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22] mb-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="flex items-center justify-between mb-6 border-b border-gray-700/50 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Layers className="w-5 h-5 text-[#5865f2]" /> Embed Message</h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <span className="mr-3 text-sm font-medium text-gray-300 transition-colors">{useEmbed ? 'ON' : 'OFF'}</span>
                        <input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} />
                        <div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                </div>
                {useEmbed && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-6">
                             <div className="flex gap-4">
                                <div className="flex-1"><ImageInput label="Author Icon" value={embedData.author_icon} onChange={(v) => handleEmbedChange('author_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                <div className="flex-1"><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 tracking-wide">Author Name</label><SmartInput value={embedData.author_name} onChange={(v) => handleEmbedChange('author_name', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded-md border border-[#1e1f22]" placeholder="{user.username}" maxLength={256} /></div>
                            </div>
                            <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 tracking-wide">Title</label><SmartInput value={embedData.title} onChange={(v) => handleEmbedChange('title', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded-md border border-[#1e1f22] font-bold" maxLength={256} /></div>
                            <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 tracking-wide">Description</label><SmartInput isTextarea={true} maxLength={4096} value={embedData.description} onChange={(v) => handleEmbedChange('description', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded-md border border-[#1e1f22] min-h-[120px]" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 tracking-wide">Color</label><div className="flex gap-2"><input type="color" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="h-10 w-12 bg-transparent border-none cursor-pointer rounded overflow-hidden" /><input type="text" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded-md border border-[#1e1f22] uppercase font-mono" /></div></div>
                                <div><ImageInput label="Thumbnail URL" value={embedData.thumbnail} onChange={(v) => handleEmbedChange('thumbnail', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                            </div>
                            <ImageInput label="Image URL" value={embedData.image} onChange={(v) => handleEmbedChange('image', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} />
                            <div className="border-t border-[#3f4147] pt-6"><div className="flex gap-4"><div className="w-1/3"><ImageInput label="Footer Icon" value={embedData.footer_icon} onChange={(v) => handleEmbedChange('footer_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div><div className="flex-1"><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2 tracking-wide">Footer Text</label><SmartInput value={embedData.footer_text} onChange={(v) => handleEmbedChange('footer_text', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2.5 rounded-md border border-[#1e1f22]" maxLength={2048} /></div></div></div>
                        </div>
                        <div className="sticky top-6 h-fit">
                             <div className="flex items-center justify-between mb-2 w-full max-w-md">
                                <h3 className="text-[#949ba4] text-xs font-bold uppercase tracking-wide flex items-center gap-2"><Layers className="w-4 h-4"/> Embed Preview</h3>
                                <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full animate-pulse">● Live Update</span>
                             </div>
                             <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                                <EmbedPreview />
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Settings */}
            <div className="bg-[#2b2d31] p-8 rounded-2xl border border-[#1e1f22] shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="flex items-center justify-between mb-8 border-b border-gray-700/50 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Palette className="w-5 h-5 text-[#5865f2]" /> Welcome Image</h2>
                    <label className="relative inline-flex items-center cursor-pointer"><span className="mr-3 text-sm font-medium text-gray-300">{useImage ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useImage} onChange={(e) => setUseImage(e.target.checked)} /><div className="relative w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div></label>
                </div>
                {useImage && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="space-y-6">
                            <div className="bg-[#1e1f22] p-5 rounded-lg border border-[#3f4147] shadow-inner"><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-3 flex items-center gap-2"><Type className="w-4 h-4" /> เลือกแบบอักษร (Font)</label><select value={imageData.font_name} onChange={(e) => handleImageChange('font_name', e.target.value)} className="w-full bg-[#2b2d31] text-white p-2.5 rounded-md border border-[#3f4147] focus:border-[#5865f2] cursor-pointer">{availableFonts.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                            <ImageInput label="URL พื้นหลัง (Background Image)" value={imageData.bg_url} onChange={(v) => handleImageChange('bg_url', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} />
                            <div className="space-y-6 bg-[#1e1f22] p-6 rounded-lg border border-[#3f4147] shadow-inner"><h3 className="text-white text-sm font-bold border-b border-gray-700 pb-2 flex items-center gap-2"><Info className="w-4 h-4 text-yellow-500" /> ตั้งค่าข้อความบนภาพ</h3>
                                <div className="space-y-4 pt-2">
                                    <div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">บรรทัดที่ 1 (Title)</label><SmartInput value={imageData.image_title} onChange={(v) => handleImageChange('image_title', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147]" maxLength={30} /></div><div><div className="flex items-center bg-[#2b2d31] p-1 rounded border border-[#3f4147] h-[38px] hover:border-[#5865f2] transition-colors"><input type="color" value={imageData.title_color} onChange={(e) => handleImageChange('title_color', e.target.value)} className="h-6 w-8 bg-transparent cursor-pointer" /></div></div></div>
                                    <div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">บรรทัดที่ 2 (Username)</label><SmartInput value={imageData.image_username} onChange={(v) => handleImageChange('image_username', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147]" maxLength={32} /></div><div><div className="flex items-center bg-[#2b2d31] p-1 rounded border border-[#3f4147] h-[38px] hover:border-[#5865f2] transition-colors"><input type="color" value={imageData.username_color} onChange={(e) => handleImageChange('username_color', e.target.value)} className="h-6 w-8 bg-transparent border-none cursor-pointer" /></div></div></div>
                                    <div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">บรรทัดที่ 3 (Sub-Text)</label><SmartInput value={imageData.text_content} onChange={(v) => handleImageChange('text_content', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147]" maxLength={50} /></div><div><div className="flex items-center bg-[#2b2d31] p-1 rounded border border-[#3f4147] h-[38px] hover:border-[#5865f2] transition-colors"><input type="color" value={imageData.message_color} onChange={(e) => handleImageChange('message_color', e.target.value)} className="h-6 w-8 bg-transparent border-none cursor-pointer" /></div></div></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6"><div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-3">Avatar Shape</label><div className="flex bg-[#1e1f22] rounded p-1 border border-[#3f4147]"><button type="button" onClick={() => handleImageChange('avatar_shape', 'circle')} className={`flex-1 py-1.5 text-xs rounded transition ${imageData.avatar_shape === 'circle' ? 'bg-[#5865f2] text-white shadow-md' : 'text-gray-400'}`}>Circle</button><button type="button" onClick={() => handleImageChange('avatar_shape', 'square')} className={`flex-1 py-1.5 text-xs rounded transition ${imageData.avatar_shape === 'square' ? 'bg-[#5865f2] text-white shadow-md' : 'text-gray-400'}`}>Square</button></div></div><div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-3 flex justify-between">Overlay Opacity <span>{imageData.overlay_opacity}%</span></label><input type="range" min="0" max="100" value={imageData.overlay_opacity} onChange={(e) => handleImageChange('overlay_opacity', Number(e.target.value))} className="w-full h-2 bg-[#1e1f22] rounded appearance-none cursor-pointer accent-[#5865f2]" /></div></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">Position</label><select value={imageData.image_position} onChange={(e) => handleImageChange('image_position', e.target.value as any)} className="w-full bg-[#1e1f22] text-white p-2 rounded border border-[#3f4147] text-xs focus:border-[#5865f2] transition-all"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="text">Text Only</option></select></div>
                                <div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">Circle Color</label><div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147] hover:border-[#5865f2] transition-all"><input type="color" value={imageData.circle_color} onChange={(e) => handleImageChange('circle_color', e.target.value)} className="h-5 w-full bg-transparent border-none cursor-pointer" /></div></div>
                                <div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">Overlay Color</label><div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147] hover:border-[#5865f2] transition-all"><input type="color" value={imageData.overlay_color} onChange={(e) => handleImageChange('overlay_color', e.target.value)} className="h-5 w-full bg-transparent border-none cursor-pointer" /></div></div>
                            </div>
                        </div>
                        <div className="sticky top-6 h-fit space-y-4">
                            <div className="flex items-center justify-between mb-2"><h3 className="text-[#949ba4] text-xs font-bold uppercase tracking-wide flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Live Preview Image</h3><span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full animate-pulse">● Live Update</span></div>
                            <ImagePreview imageData={imageData} botInfo={botInfo} userProfile={userProfile} guildProfile={guildProfile} guildId={guildId} API_URL={API_URL} />
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Save Bar with Glassmorphism */}
            <div className={`fixed bottom-0 left-0 right-0 p-6 flex justify-center items-center transition-all duration-500 transform ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} z-50`}>
                <div className="bg-[#111214]/90 backdrop-blur-md border border-[#2b2d31] p-4 rounded-2xl shadow-2xl flex items-center gap-6 max-w-2xl w-full justify-between animate-in slide-in-from-bottom-10 fade-in duration-300">
                     <span className="text-white font-medium flex items-center gap-2 pl-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                        คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                    </span>
                    <div className="flex gap-3">
                        <button type="button" onClick={handleReset} className="flex items-center gap-2 text-[#dbdee1] hover:text-white px-4 py-2 rounded hover:bg-[#2b2d31] transition-all duration-200 font-medium text-sm">
                            <RotateCcw className="w-4 h-4" /> Reset
                        </button>
                        <button type="submit" onClick={handleSave} className="bg-[#23a559] hover:bg-[#1f934e] text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-[#23a559]/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm">
                            <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง (Save Changes)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}