"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';

// --- 📜 รายการตัวแปร ---
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

// --- 🧠 SmartInput Component ---
const SmartInput = ({ value, onChange, placeholder, className, isTextarea = false, maxLength }: any) => {
    const [showMenu, setShowMenu] = useState(false);
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleChange = (e: any) => {
        const val = e.target.value;
        onChange(val);
        const cursor = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z0-9._@#:]*)$/);
        if (match) { setShowMenu(true); setFilter(match[1].toLowerCase()); } else { setShowMenu(false); }
    };

    const insertVar = (varName: string) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart;
        const textBeforeCursor = value.slice(0, cursor);
        const textAfterCursor = value.slice(cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z0-9._@#:]*)$/);
        if (match) {
            const startPos = cursor - match[1].length - 1;
            const newText = value.slice(0, startPos) + `{${varName}}` + textAfterCursor;
            onChange(newText);
            setShowMenu(false);
            setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(startPos + varName.length + 2, startPos + varName.length + 2); }, 0);
        }
    };

    const filteredVars = AVAILABLE_VARS.filter(v => v.name.toLowerCase().includes(filter));

    return (
        <div className="relative w-full">
            {isTextarea ? (
                <textarea ref={inputRef as any} value={value} onChange={handleChange} className={className} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            ) : (
                <input ref={inputRef as any} type="text" value={value} onChange={handleChange} className={className} placeholder={placeholder} maxLength={maxLength} onBlur={() => setTimeout(() => setShowMenu(false), 200)} />
            )}
            {showMenu && filteredVars.length > 0 && (
                <div className="absolute z-50 bg-[#2b2d31] border border-[#1e1f22] rounded shadow-xl mt-1 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar" style={{ top: '100%', left: 0 }}>
                    {filteredVars.map(v => (
                        <div key={v.name} onMouseDown={(e) => { e.preventDefault(); insertVar(v.name); }} className="px-3 py-2 hover:bg-[#3f4147] cursor-pointer flex justify-between items-center transition-colors border-b border-[#1e1f22] last:border-0">
                            <span className="font-bold text-[#dbdee1] font-mono text-xs">{`{${v.name}}`}</span>
                            <span className="text-[#949ba4] text-[10px] bg-[#1e1f22] px-2 py-0.5 rounded">{v.desc}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Helper Functions ---
const parseMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\]\([^)]+\)|<@[^>]+>|<#[^>]+>|:\d+:)/g);
    return parts.map((part, index) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#00b0f4] hover:underline cursor-pointer">{linkMatch[1]}</a>;
        
        // 🔥 Render Mention (User) -> แสดงชื่อที่อยู่ใน <@...>
        const mentionMatch = part.match(/^<@([^>]+)>$/);
        if (mentionMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium hover:bg-[#5865f2] hover:text-white transition-colors cursor-pointer inline-block">@{mentionMatch[1]}</span>;
        
        // 🔥 Render Mention (Channel)
        const channelMatch = part.match(/^<#([^>]+)>$/);
        if (channelMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium hover:bg-[#5865f2] hover:text-white transition-colors cursor-pointer inline-block">#{channelMatch[1]}</span>;
        
        const emojiMatch = part.match(/^:(\d+):$/);
        if (emojiMatch) return <img key={index} src={`https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`} className="w-5 h-5 inline-block align-middle mx-[2px] object-contain" alt="emoji"/>;
        return part;
    });
};

const previewReplacer = (text: string, botAvatar: string, userReal: any, guildReal: any, isTextOnly: boolean = false) => {
    if (!text) return "";
    let msg = text;

    const realUsername = userReal?.username || "username"; 
    const globalName = userReal?.global_name || realUsername;
    
    // 🔥 FIX: ใช้ Global Name ในแท็ก เพื่อให้ Preview แสดง @GlobalName (เช่น @! . nam2871)
    // แต่ถ้าเป็น Text Only (วาดลงรูป) ให้แสดงแค่ชื่อเฉยๆ ไม่ต้องมี <@...>
    const userMention = isTextOnly ? globalName : `<@${globalName}>`; 

    const userId = userReal?.id || "123456789012345678";
    const userAvatarExt = userReal?.avatar?.startsWith("a_") ? "gif" : "png";
    const userAvatarUrl = userReal?.avatar ? `https://cdn.discordapp.com/avatars/${userReal.id}/${userReal.avatar}.${userAvatarExt}?size=256` : "https://cdn.discordapp.com/embed/avatars/0.png";
    
    const serverName = guildReal?.name || "My Awesome Server";
    const serverId = guildReal?.id || "987654321098765432";
    const serverIconUrl = guildReal?.icon ? `https://cdn.discordapp.com/icons/${guildReal.id}/${guildReal.icon}.png` : "https://cdn.discordapp.com/embed/avatars/1.png";
    const realMemberCount = guildReal?.approximate_member_count || guildReal?.member_count || "17";

    // Replace Variables
    msg = msg.replace(/\{user\}/gi, userMention);              // -> <@! . nam2871> (Embed) หรือ ! . nam2871 (Image)
    msg = msg.replace(/\{user\.mention\}/gi, userMention);
    
    msg = msg.replace(/\{user\.username\}/gi, realUsername);    // -> nattapat2871
    msg = msg.replace(/\{user\.global_name\}/gi, globalName);   // -> ! . nam2871
    
    msg = msg.replace(/\{user\.id\}/gi, userId);
    msg = msg.replace(/\{user\.avatar\}/gi, userAvatarUrl); 
    msg = msg.replace(/\{server\.name\}/gi, serverName);
    msg = msg.replace(/\{server\.id\}/gi, serverId);
    msg = msg.replace(/\{server\.icon\}/gi, serverIconUrl); 
    msg = msg.replace(/\{membercount\}/gi, realMemberCount);
    msg = msg.replace(/\{membercount\.ordinal\}/gi, `${realMemberCount}th`);
    
    msg = msg.replace(/\{#(.*?)\}/g, (match, p1) => isTextOnly ? `#${p1}` : `<#${p1}>`);
    msg = msg.replace(/\{@(.*?)\}/g, (match, p1) => isTextOnly ? `@${p1}` : `<@${p1}>`);
    msg = msg.replace(/\{:(.*?)\}/g, (match, p1) => isTextOnly ? `:${p1}:` : `:${p1}:`); 

    return msg;
};

const ImageInput = ({ label, value, onChange, botAvatar, userReal, guildReal }: any) => {
    const [preview, setPreview] = useState("");
    useEffect(() => {
        if (!value) { setPreview(""); return; }
        if (value.includes("{")) {
            const simulatedUrl = previewReplacer(value, botAvatar, userReal, guildReal, true);
            setPreview(simulatedUrl);
            return;
        }
        const img = new Image();
        img.src = value;
        img.onload = () => setPreview(value);
        img.onerror = () => setPreview(""); 
    }, [value, botAvatar, userReal, guildReal]);

    return (
        <div className="mb-4">
            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">{label}</label>
            <div className="flex gap-2">
                <SmartInput value={value} onChange={onChange} placeholder="https://... หรือ {user.avatar}" className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] text-sm focus:outline-none focus:border-[#5865f2]" />
                {preview && (
                    <div className="relative group shrink-0">
                        <img src={preview} className="w-8 h-8 rounded object-cover border border-[#1e1f22]" alt="Preview" />
                        {value.includes("{") && (<div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-xs text-white p-1 rounded whitespace-nowrap z-10">Preview</div>)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function JoinSettingsPage() {
    const params = useParams();
    const guildId = params.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const [channels, setChannels] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null); 
    const [guildProfile, setGuildProfile] = useState<any>(null);
    const [availableFonts, setAvailableFonts] = useState<string[]>(["Default"]);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [message, setMessage] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [botInfo, setBotInfo] = useState({ name: "Bot", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
    
    // --- Embed State ---
    const [useEmbed, setUseEmbed] = useState(false);
    const [embedData, setEmbedData] = useState({
        author_name: "", author_icon: "", title: "", description: "", url: "", color: "#5865f2",
        thumbnail: "", image: "", footer_text: "", footer_icon: "", 
        timestamp_mode: "none", // none | current | custom
        custom_timestamp: "" // ISO date-time string
    });

    // --- Image State ---
    const [useImage, setUseImage] = useState(false);
    const [imageData, setImageData] = useState({
        bg_url: "", image_title: "WELCOME", image_username: "{user.username}", text_content: "Welcome to {server.name}!",
        font_name: "Default", avatar_shape: "circle", overlay_opacity: 50, image_position: "left",
        title_color: "#FFFFFF", username_color: "#00FFFF", message_color: "#FFFFFF", circle_color: "#FFFFFF", overlay_color: "#000000"
    });

    useEffect(() => {
        fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).then(res => res.json()).then(data => { if (!data.error) setUserProfile(data); });
        fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(res => res.json()).then(data => setChannels(data.channels || []));
        fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' }).then(res => res.json()).then(data => {
            if(Array.isArray(data)){ const currentGuild = data.find(g => g.id === guildId); if(currentGuild) setGuildProfile(currentGuild); }
        });
        fetch(`${API_URL}/api/announce/list_fonts`, { credentials: 'include' }).then(res => res.json()).then(data => { if (data.fonts) setAvailableFonts(data.fonts); });

        fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.bot_avatar) setBotInfo({ name: data.bot_name, avatar: data.bot_avatar });
                setSelectedChannel(data.welcome_channel_id || "");
                setMessage(data.welcome_message || "");
                setIsEnabled(data.is_welcome_enabled || false);
                setUseEmbed(data.use_embed || false);
                if (data.embed_data && Object.keys(data.embed_data).length > 0) {
                    setEmbedData(prev => ({ ...prev, ...data.embed_data }));
                }
                setUseImage(data.use_image || false);
                if (data.image_data) { setImageData(prev => ({ ...prev, ...data.image_data, font_name: data.image_data.font_name || "Default" })); }
            });
    }, [guildId, API_URL]);

    const handleEmbedChange = (key: string, value: any) => setEmbedData(prev => ({ ...prev, [key]: value }));
    const handleImageChange = (key: string, value: any) => setImageData(prev => ({ ...prev, [key]: value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            channel_id: selectedChannel, message: message,
            use_embed: useEmbed, embed_data: embedData,
            use_image: useImage, image_data: imageData
        };
        const res = await fetch(`${API_URL}/api/announcements/${guildId}/save_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
        if (res.ok) Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', background: '#2b2d31', color: '#dbdee1', confirmButtonColor: '#5865f2', timer: 1500 });
        else Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: 'บันทึกไม่สำเร็จ', icon: 'error', background: '#2b2d31', color: '#dbdee1', confirmButtonColor: '#5865f2' });
    };

    const toggleSwitch = async (checked: boolean) => {
        setIsEnabled(checked);
        await fetch(`${API_URL}/api/announcements/${guildId}/toggle_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: checked }), credentials: 'include' });
    };

    // --- Embed Preview ---
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

        let timeDisplay = "";
        if (embedData.timestamp_mode === 'current') {
            timeDisplay = "Today at " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (embedData.timestamp_mode === 'custom' && embedData.custom_timestamp) {
            const d = new Date(embedData.custom_timestamp);
            if (!isNaN(d.getTime())) {
                 timeDisplay = d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            } else {
                 timeDisplay = "Invalid Date";
            }
        }

        return (
            <div className="bg-[#313338] p-4 rounded-lg font-sans text-[#dbdee1] w-full overflow-hidden border border-[#2e3035]">
                <div className="flex items-start gap-3 w-full min-w-0">
                    <img src={botInfo.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="Bot" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="font-medium text-white">{botInfo.name}</span>
                            <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded h-4 flex items-center shrink-0">BOT</span>
                            <span className="text-xs text-[#949ba4] ml-1">Today at 12:00 PM</span>
                        </div>
                        {pMessage && <div className="mt-1 whitespace-pre-wrap text-sm">{parseMarkdown(pMessage)}</div>}
                        
                        {useEmbed && (
                            <div className="mt-2 bg-[#2b2d31] rounded flex w-full border-l-4 overflow-hidden" style={{ borderColor: embedData.color }}>
                                <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
                                    {pAuthorName && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                                            {pAuthorIcon && <img src={pAuthorIcon} className="w-6 h-6 rounded-full object-cover shrink-0" alt="Icon" />}
                                            <span className="truncate">{pAuthorName}</span>
                                        </div>
                                    )}
                                    {pTitle && <div className="font-bold text-white text-base">{parseMarkdown(pTitle)}</div>}
                                    {pDesc && <div className="text-sm text-[#dbdee1] whitespace-pre-wrap">{parseMarkdown(pDesc)}</div>}
                                    {pImage && <img src={pImage} className="w-full rounded mt-2 object-cover max-h-[300px]" alt="Main" />}
                                    
                                    {(pFooterText || embedData.timestamp_mode !== 'none') && (
                                        <div className="flex items-center gap-2 text-xs text-[#949ba4] mt-1">
                                            {pFooterIcon && <img src={pFooterIcon} className="w-5 h-5 rounded-full shrink-0" alt="Footer" />}
                                            <div className="flex items-center gap-1">
                                                {pFooterText && <span>{pFooterText}</span>}
                                                {pFooterText && embedData.timestamp_mode !== 'none' && <span>•</span>}
                                                {embedData.timestamp_mode !== 'none' && <span>{timeDisplay}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {pThumbnail && <div className="p-4 pl-0 shrink-0"><img src={pThumbnail} className="w-20 h-20 rounded object-cover" alt="Thumb" /></div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- Image Preview ---
    const ImagePreview = () => {
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        useEffect(() => {
            const fetchPreview = async () => {
                setIsLoading(true);
                const pTitle = previewReplacer(imageData.image_title, botInfo.avatar, userProfile, guildProfile, true);
                const pUsername = previewReplacer(imageData.image_username, botInfo.avatar, userProfile, guildProfile, true);
                const pText = previewReplacer(imageData.text_content, botInfo.avatar, userProfile, guildProfile, true);
                
                const userAvatarExt = userProfile?.avatar?.startsWith("a_") ? "gif" : "png";
                const userAvatarUrl = userProfile?.avatar ? `https://cdn.discordapp.com/avatars/${userProfile.id}/${userProfile.avatar}.${userAvatarExt}?size=256` : (botInfo.avatar || "https://cdn.discordapp.com/embed/avatars/0.png");

                try {
                    const res = await fetch(`${API_URL}/api/announcements/${guildId}/preview_join_image`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bg_url: imageData.bg_url, image_title: pTitle, image_username: pUsername, text_content: pText, font_name: imageData.font_name,
                            avatar_url: userAvatarUrl, avatar_shape: imageData.avatar_shape, overlay_opacity: imageData.overlay_opacity, image_position: imageData.image_position,
                            title_color: imageData.title_color, username_color: imageData.username_color, message_color: imageData.message_color, circle_color: imageData.circle_color, overlay_color: imageData.overlay_color
                        })
                    });
                    if (res.ok) { const blob = await res.blob(); setPreviewUrl(URL.createObjectURL(blob)); }
                } catch (e) { console.error("Preview failed", e); } finally { setIsLoading(false); }
            };
            const timer = setTimeout(() => fetchPreview(), 800);
            return () => clearTimeout(timer);
        }, [imageData, userProfile, guildProfile, guildId, API_URL, botInfo]);

        return (
            <div className="relative w-full aspect-[1000/480] rounded-lg overflow-hidden border border-[#1e1f22] shadow-md bg-[#232428] flex items-center justify-center">
                {isLoading && (<div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>)}
                {previewUrl ? (<img src={previewUrl} alt="Welcome Preview" className="w-full h-full object-contain" />) : (<div className="text-[#949ba4] text-xs">กำลังโหลดตัวอย่าง...</div>)}
            </div>
        );
    };

    return (
        <div className="flex flex-col pb-12 p-8 min-h-screen max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div><h1 className="text-3xl font-bold text-white">Welcome Message Settings</h1><p className="text-[#949ba4]">จัดการข้อความต้อนรับเมื่อมีคนเข้าเซิร์ฟเวอร์</p></div>
                <label className="relative inline-flex items-center cursor-pointer scale-125 mr-4"><input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => toggleSwitch(e.target.checked)} /><div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div></label>
            </div>

            <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] mb-8 shadow-lg">
                <h2 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">📂 การตั้งค่าทั่วไป (General)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">ส่งไปที่ห้อง (Channel)</label><select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2]"><option value="">-- เลือกห้อง --</option>{channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}</select></div>
                    <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">ข้อความหลัก (Main Message)</label><SmartInput value={message} onChange={setMessage} placeholder="ข้อความทักทาย (พิมพ์ { เพื่อเลือกตัวแปร)" className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2]" /></div>
                </div>
            </div>

            <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] mb-8 shadow-lg">
                <div className="flex items-center justify-between mb-6 border-b border-gray-600 pb-4"><h2 className="text-xl font-bold text-white flex items-center gap-2">📝 Embed Message <span className="text-xs font-normal text-gray-400 bg-black/20 px-2 py-1 rounded">การ์ดข้อความ</span></h2><label className="relative inline-flex items-center cursor-pointer"><span className="mr-3 text-sm font-medium text-gray-300">{useEmbed ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} /><div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></label></div>

                {useEmbed && (
                    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-4 order-2 xl:order-1">
                             <div className="flex gap-4">
                                <div className="flex-1"><ImageInput label="Author Icon" value={embedData.author_icon} onChange={(v: string) => handleEmbedChange('author_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                <div className="flex-1"><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Author Name</label><SmartInput value={embedData.author_name} onChange={(v: any) => handleEmbedChange('author_name', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22]" placeholder="{user.username}" /></div>
                            </div>
                            <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Title</label><SmartInput value={embedData.title} onChange={(v: any) => handleEmbedChange('title', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] font-bold" /></div>
                            <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Description</label><SmartInput isTextarea={true} maxLength={4096} value={embedData.description} onChange={(v: any) => handleEmbedChange('description', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] min-h-[100px]" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Color</label><div className="flex gap-2"><input type="color" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="h-10 w-12 bg-transparent border-none cursor-pointer" /><input type="text" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] uppercase" /></div></div>
                                <div><ImageInput label="Thumbnail URL" value={embedData.thumbnail} onChange={(v: string) => handleEmbedChange('thumbnail', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                            </div>
                            <ImageInput label="Image URL" value={embedData.image} onChange={(v: string) => handleEmbedChange('image', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} />
                            
                            <div className="border-t border-[#3f4147] pt-4 space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-1/3"><ImageInput label="Footer Icon" value={embedData.footer_icon} onChange={(v: string) => handleEmbedChange('footer_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                    <div className="flex-1"><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Footer Text</label><SmartInput value={embedData.footer_text} onChange={(v: any) => handleEmbedChange('footer_text', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22]" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Timestamp Mode</label>
                                        <select value={embedData.timestamp_mode} onChange={(e) => handleEmbedChange('timestamp_mode', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2]">
                                            <option value="none">ปิด (None)</option>
                                            <option value="current">เวลาปัจจุบัน (Current Time)</option>
                                            <option value="custom">กำหนดเอง (Custom Date)</option>
                                        </select>
                                    </div>
                                    {embedData.timestamp_mode === 'custom' && (
                                        <div className="animate-in fade-in slide-in-from-top-1">
                                            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Select Date & Time</label>
                                            <input type="datetime-local" value={embedData.custom_timestamp} onChange={(e) => handleEmbedChange('custom_timestamp', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2] h-[38px]" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 xl:max-w-[500px] order-1 xl:order-2">
                             <div className="sticky top-6"><h3 className="text-[#949ba4] text-xs font-bold uppercase mb-2 text-right">Embed Preview</h3><EmbedPreview /></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1e1f22] shadow-lg">
                <div className="flex items-center justify-between mb-6 border-b border-gray-600 pb-4"><h2 className="text-xl font-bold text-white flex items-center gap-2">🖼️ Welcome Image <span className="text-xs font-normal text-gray-400 bg-black/20 px-2 py-1 rounded">รูปภาพต้อนรับ</span></h2><label className="relative inline-flex items-center cursor-pointer"><span className="mr-3 text-sm font-medium text-gray-300">{useImage ? 'ON' : 'OFF'}</span><input type="checkbox" className="sr-only peer" checked={useImage} onChange={(e) => setUseImage(e.target.checked)} /><div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div></label></div>
                {useImage && (
                    <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-5 order-2 xl:order-1">
                            <div className="bg-[#1e1f22] p-4 rounded border border-[#3f4147]"><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">เลือกแบบอักษร (Font)</label><select value={imageData.font_name} onChange={(e) => handleImageChange('font_name', e.target.value)} className="w-full bg-[#2b2d31] text-white p-2 rounded border border-[#3f4147] focus:outline-none focus:border-[#5865f2]">{availableFonts.map(f => <option key={f} value={f}>{f}</option>)}</select><p className="text-[10px] text-gray-400 mt-1">*เพิ่มฟอนต์ได้ที่โฟลเดอร์ <code>cogs/functions/announcements/fonts</code></p></div>
                            <ImageInput label="URL พื้นหลัง (Background Image)" value={imageData.bg_url} onChange={(v: string) => handleImageChange('bg_url', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} />
                            <div className="space-y-4 bg-[#1e1f22] p-4 rounded border border-[#3f4147]">
                                <h3 className="text-white text-sm font-bold border-b border-gray-600 pb-2 mb-2">🔤 ตั้งค่าข้อความ 3 บรรทัด</h3>
                                <div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">บรรทัดที่ 1 (Title)</label><SmartInput value={imageData.image_title} onChange={(v: any) => handleImageChange('image_title', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147]" /></div><div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">สี (Color)</label><div className="flex items-center gap-2 bg-[#2b2d31] p-1 rounded border border-[#3f4147] h-[38px]"><input type="color" value={imageData.title_color} onChange={(e) => handleImageChange('title_color', e.target.value)} className="h-6 w-6 bg-transparent border-none cursor-pointer p-0" /></div></div></div>
                                <div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">บรรทัดที่ 2 (Username)</label><SmartInput value={imageData.image_username} onChange={(v: any) => handleImageChange('image_username', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147]" /></div><div><div className="flex items-center gap-2 bg-[#2b2d31] p-1 rounded border border-[#3f4147] h-[38px]"><input type="color" value={imageData.username_color} onChange={(e) => handleImageChange('username_color', e.target.value)} className="h-6 w-6 bg-transparent border-none cursor-pointer p-0" /></div></div></div>
                                <div className="flex gap-4 items-end"><div className="flex-1"><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">บรรทัดที่ 3 (Sub-Text)</label><SmartInput value={imageData.text_content} onChange={(v: any) => handleImageChange('text_content', v)} className="w-full bg-[#2b2d31] text-[#dbdee1] p-2 rounded border border-[#3f4147]" /></div><div><div className="flex items-center gap-2 bg-[#2b2d31] p-1 rounded border border-[#3f4147] h-[38px]"><input type="color" value={imageData.message_color} onChange={(e) => handleImageChange('message_color', e.target.value)} className="h-6 w-6 bg-transparent border-none cursor-pointer p-0" /></div></div></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Avatar Shape</label><div className="flex bg-[#1e1f22] rounded p-1"><button type="button" onClick={() => handleImageChange('avatar_shape', 'circle')} className={`flex-1 py-1 text-xs rounded transition ${imageData.avatar_shape === 'circle' ? 'bg-[#5865f2] text-white' : 'text-gray-400'}`}>Circle</button><button type="button" onClick={() => handleImageChange('avatar_shape', 'square')} className={`flex-1 py-1 text-xs rounded transition ${imageData.avatar_shape === 'square' ? 'bg-[#5865f2] text-white' : 'text-gray-400'}`}>Square</button></div></div><div><label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Overlay Opacity: {imageData.overlay_opacity}%</label><input type="range" min="0" max="100" value={imageData.overlay_opacity} onChange={(e) => handleImageChange('overlay_opacity', Number(e.target.value))} className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer accent-[#5865f2] mt-2" /></div></div>
                            <div className="grid grid-cols-3 gap-2"><div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">Position</label><select value={imageData.image_position} onChange={(e) => handleImageChange('image_position', e.target.value)} className="w-full bg-[#1e1f22] text-white p-2 rounded border border-[#3f4147] text-xs"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="text">Text Only (No Avatar)</option></select></div><div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">Circle Color</label><div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147]"><input type="color" value={imageData.circle_color} onChange={(e) => handleImageChange('circle_color', e.target.value)} className="h-6 w-6 bg-transparent border-none cursor-pointer" /></div></div><div><label className="block text-[#b5bac1] text-[10px] font-bold uppercase mb-1">Overlay Color</label><div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147]"><input type="color" value={imageData.overlay_color} onChange={(e) => handleImageChange('overlay_color', e.target.value)} className="h-6 w-6 bg-transparent border-none cursor-pointer" /></div></div></div>
                        </div>
                        <div className="flex-1 xl:max-w-[500px] order-1 xl:order-2"><div className="sticky top-6"><h3 className="text-[#949ba4] text-xs font-bold uppercase mb-2 text-right">Image Preview</h3><ImagePreview /><p className="text-[#949ba4] text-[10px] mt-2 text-right">*รูปภาพที่ได้จริงอาจแตกต่างเล็กน้อยขึ้นอยู่กับการประมวลผลของบอท</p></div></div>
                    </div>
                )}
            </div>
            <button type="submit" onClick={handleSave} className="fixed bottom-6 right-6 bg-[#23a559] hover:bg-[#1f934e] text-white font-bold py-3 px-8 rounded-full shadow-2xl transition-transform hover:scale-105 z-50 flex items-center gap-2"><span>💾 Save Changes</span></button>
        </div>
    );
}