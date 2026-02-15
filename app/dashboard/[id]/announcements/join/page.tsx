"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';

// --- 📜 รายการตัวแปรทั้งหมดสำหรับระบบ Autocomplete ---
const AVAILABLE_VARS = [
    { name: "user", desc: "แท็กชื่อ (@User)" },
    { name: "user.username", desc: "ชื่อผู้ใช้" },
    { name: "user.id", desc: "ไอดีผู้ใช้" },
    { name: "user.avatar", desc: "ลิงก์รูปโปรไฟล์" },
    { name: "server.name", desc: "ชื่อเซิร์ฟเวอร์" },
    { name: "server.id", desc: "ไอดีเซิร์ฟเวอร์" },
    { name: "server.icon", desc: "ลิงก์รูปไอคอน" },
    { name: "membercount", desc: "จำนวนคน" },
    { name: "membercount.ordinal", desc: "ลำดับคน (ex. 150th)" }
];

// --- 🧠 คอมโพเนนต์ช่องพิมพ์อัจฉริยะ (SmartInput) ---
const SmartInput = ({ value, onChange, placeholder, className, isTextarea = false, maxLength }: any) => {
    const [showMenu, setShowMenu] = useState(false);
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    const handleChange = (e: any) => {
        const val = e.target.value;
        onChange(val);

        const cursor = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/\{([a-zA-Z.]*)$/);

        if (match) {
            setShowMenu(true);
            setFilter(match[1].toLowerCase());
        } else {
            setShowMenu(false);
        }
    };

    const insertVar = (varName: string) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart;
        const textBeforeCursor = value.slice(0, cursor);
        const textAfterCursor = value.slice(cursor);
        
        const match = textBeforeCursor.match(/\{([a-zA-Z.]*)$/);
        if (match) {
            const startPos = cursor - match[1].length - 1;
            const newText = value.slice(0, startPos) + `{${varName}}` + textAfterCursor;
            onChange(newText);
            setShowMenu(false);
            
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(startPos + varName.length + 2, startPos + varName.length + 2);
            }, 0);
        }
    };

    const filteredVars = AVAILABLE_VARS.filter(v => v.name.toLowerCase().includes(filter));

    return (
        <div className="relative w-full">
            {isTextarea ? (
                <textarea 
                    ref={inputRef as any} value={value} onChange={handleChange} 
                    className={className} placeholder={placeholder} maxLength={maxLength} 
                    onBlur={() => setTimeout(() => setShowMenu(false), 200)} 
                />
            ) : (
                <input 
                    ref={inputRef as any} type="text" value={value} onChange={handleChange} 
                    className={className} placeholder={placeholder} maxLength={maxLength} 
                    onBlur={() => setTimeout(() => setShowMenu(false), 200)} 
                />
            )}
            
            {showMenu && filteredVars.length > 0 && (
                <div className="absolute z-50 bg-[#2b2d31] border border-[#1e1f22] rounded shadow-xl mt-1 max-h-48 overflow-y-auto w-full sm:w-64 text-sm custom-scrollbar"
                     style={{ top: '100%', left: 0 }}>
                    {filteredVars.map(v => (
                        <div 
                            key={v.name} 
                            onMouseDown={(e) => { e.preventDefault(); insertVar(v.name); }} 
                            className="px-3 py-2 hover:bg-[#3f4147] cursor-pointer flex justify-between items-center transition-colors border-b border-[#1e1f22] last:border-0"
                        >
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
        
        const mentionMatch = part.match(/^<@([^>]+)>$/);
        if (mentionMatch) return <span key={index} className="bg-[#5865f2]/30 text-[#c9cdfb] px-[4px] py-[1px] mx-[2px] rounded font-medium hover:bg-[#5865f2] hover:text-white transition-colors cursor-pointer inline-block">@{mentionMatch[1]}</span>;

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

    const username = userReal?.global_name || userReal?.username || "User";
    const userMention = isTextOnly ? username : `<@${username}>`; 
    const userId = userReal?.id || "123456789012345678";
    const userAvatarExt = userReal?.avatar?.startsWith("a_") ? "gif" : "png";
    const userAvatarUrl = userReal?.avatar ? `https://cdn.discordapp.com/avatars/${userReal.id}/${userReal.avatar}.${userAvatarExt}?size=256` : "https://cdn.discordapp.com/embed/avatars/0.png";

    const serverName = guildReal?.name || "My Awesome Server";
    const serverId = guildReal?.id || "987654321098765432";
    const serverIconUrl = guildReal?.icon ? `https://cdn.discordapp.com/icons/${guildReal.id}/${guildReal.icon}.png` : "https://cdn.discordapp.com/embed/avatars/1.png";
    const realMemberCount = guildReal?.approximate_member_count || guildReal?.member_count || "17";

    msg = msg.replace(/\{user\}/gi, userMention);
    msg = msg.replace(/\{user\.mention\}/gi, userMention);
    msg = msg.replace(/\{user\.username\}/gi, username);
    msg = msg.replace(/\{user\.id\}/gi, userId);
    msg = msg.replace(/\{user\.avatar\}/gi, userAvatarUrl); 
    msg = msg.replace(/\{server\.name\}/gi, serverName);
    msg = msg.replace(/\{server\.id\}/gi, serverId);
    msg = msg.replace(/\{server\.icon\}/gi, serverIconUrl); 
    msg = msg.replace(/\{membercount\}/gi, realMemberCount);
    msg = msg.replace(/\{membercount\.ordinal\}/gi, `${realMemberCount}th`);
    
    if (isTextOnly) {
         msg = msg.replace(/\{#(.*?)\}/g, "#$1");
         msg = msg.replace(/\{@(.*?)\}/g, "@$1");
         msg = msg.replace(/\{:(\d+)\}/g, ""); 
    } else {
         msg = msg.replace(/\{#(.*?)\}/g, "<#$1>");
         msg = msg.replace(/\{@(.*?)\}/g, "<@$1>");
         msg = msg.replace(/\{:(\d+)\}/g, ":$1:"); 
    }

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
                <SmartInput 
                    value={value} 
                    onChange={onChange}
                    placeholder="https://... หรือ {user.avatar}"
                    className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] text-sm focus:outline-none focus:border-[#5865f2]"
                />
                {preview && (
                    <div className="relative group shrink-0">
                        <img src={preview} className="w-8 h-8 rounded object-cover border border-[#1e1f22]" alt="Preview" />
                        {value.includes("{") && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-xs text-white p-1 rounded whitespace-nowrap z-10">
                                Preview
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function JoinSettingsPage() {
    const params = useParams();
    const guildId = params.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [channels, setChannels] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null); 
    const [guildProfile, setGuildProfile] = useState<any>(null);

    const [selectedChannel, setSelectedChannel] = useState("");
    const [message, setMessage] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    const [botInfo, setBotInfo] = useState({ name: "Bot", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
    
    const [useEmbed, setUseEmbed] = useState(false);
    const [embedData, setEmbedData] = useState({
        author_name: "", author_icon: "", title: "", description: "", url: "", color: "#5865f2",
        thumbnail: "", image: "", footer_text: "", footer_icon: "", timestamp_mode: "none", custom_timestamp: ""
    });

    const [useImage, setUseImage] = useState(false);
    const [imageData, setImageData] = useState({
        bg_url: "https://i.imgur.com/3qP0wwe.png", 
        text_color: "#ffffff",
        text_content: "Welcome to {server.name}!"
    });

    useEffect(() => {
        fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).then(res => res.json()).then(data => { if (!data.error) setUserProfile(data); });
        fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' }).then(res => res.json()).then(data => setChannels(data.channels || []));
        fetch(`${API_URL}/api/guilds/list`, { credentials: 'include' }).then(res => res.json()).then(data => {
            if(Array.isArray(data)){ const currentGuild = data.find(g => g.id === guildId); if(currentGuild) setGuildProfile(currentGuild); }
        });

        fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.bot_avatar) setBotInfo({ name: data.bot_name, avatar: data.bot_avatar });
                setSelectedChannel(data.welcome_channel_id || "");
                setMessage(data.welcome_message || "");
                setIsEnabled(data.is_welcome_enabled || false);
                setUseEmbed(data.use_embed || false);
                if (data.embed_data && Object.keys(data.embed_data).length > 0) {
                    setEmbedData(prev => ({ ...prev, ...data.embed_data, timestamp_mode: data.embed_data.timestamp_mode || (data.embed_data.timestamp ? 'now' : 'none') }));
                }
                setUseImage(data.use_image || false);
                if (data.image_data) { setImageData(prev => ({ ...prev, ...data.image_data })); }
            });
    }, [guildId, API_URL]);

    const handleEmbedChange = (key: string, value: any) => setEmbedData(prev => ({ ...prev, [key]: value }));
    const handleImageChange = (key: string, value: any) => setImageData(prev => ({ ...prev, [key]: value }));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (embedData.description.length > 4096) {
            Swal.fire({ title: 'ข้อผิดพลาด!', text: 'รายละเอียด Embed ต้องไม่เกิน 4096 ตัวอักษร', icon: 'error', background: '#2b2d31', color: '#dbdee1', confirmButtonColor: '#5865f2' });
            return;
        }

        const payload = {
            channel_id: selectedChannel, message: message,
            use_embed: useEmbed, embed_data: embedData,
            use_image: useImage, image_data: imageData
        };

        const res = await fetch(`${API_URL}/api/announcements/${guildId}/save_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
        if (res.ok) Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', background: '#2b2d31', color: '#dbdee1', confirmButtonColor: '#5865f2', timer: 1500 });
        else Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: 'ไม่สามารถบันทึกการตั้งค่าได้', icon: 'error', background: '#2b2d31', color: '#dbdee1', confirmButtonColor: '#5865f2' });
    };

    const toggleSwitch = async (checked: boolean) => {
        setIsEnabled(checked);
        await fetch(`${API_URL}/api/announcements/${guildId}/toggle_join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: checked }), credentials: 'include' });
    };

    // --- PREVIEW ---
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

        return (
            <div className="bg-[#313338] p-4 rounded-lg font-sans text-[#dbdee1] w-full overflow-hidden">
                <div className="flex items-start gap-3 w-full min-w-0">
                    <img src={botInfo.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="Bot Avatar" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="font-medium text-white hover:underline cursor-pointer truncate">{botInfo.name}</span>
                            <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded h-4 flex items-center shrink-0">BOT</span>
                            <span className="text-xs text-[#949ba4] ml-1 shrink-0">Today at 12:00 PM</span>
                        </div>
                        {pMessage && <div className="mt-1 whitespace-pre-wrap break-words text-sm">{parseMarkdown(pMessage)}</div>}
                        
                        {useEmbed && (
                            <div className="mt-2 bg-[#2b2d31] rounded flex max-w-[520px] w-full border-l-4 overflow-hidden" style={{ borderColor: embedData.color }}>
                                <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
                                    {pAuthorName && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                                            {pAuthorIcon && <img src={pAuthorIcon} className="w-6 h-6 rounded-full object-cover shrink-0" alt="Icon" />}
                                            <span className="truncate">{pAuthorName}</span>
                                        </div>
                                    )}
                                    {pTitle && <div className="font-bold text-white text-base break-words [word-break:break-word]">{parseMarkdown(pTitle)}</div>}
                                    {pDesc && <div className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words [word-break:break-word]">{parseMarkdown(pDesc)}</div>}
                                    {pImage && <img src={pImage} className="w-full rounded mt-2 object-cover max-h-[300px]" alt="Main" />}
                                    {(pFooterText) && (
                                        <div className="flex items-start gap-2 text-xs text-[#949ba4] mt-1">
                                            {pFooterIcon && <img src={pFooterIcon} className="w-5 h-5 rounded-full shrink-0" alt="Footer" />}
                                            <span className="break-words [word-break:break-word] min-w-0">{pFooterText}</span>
                                        </div>
                                    )}
                                </div>
                                {pThumbnail && <div className="p-4 pl-0 shrink-0"><img src={pThumbnail} className="w-20 h-20 rounded object-cover" alt="Thumb" /></div>}
                            </div>
                        )}

                        {useImage && <ImagePreview />}
                    </div>
                </div>
            </div>
        );
    };

    // 🔥 ส่วนแสดงผล Preview แบบรูปภาพจริง (PNG)
    const ImagePreview = () => {
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);
        const [isLoading, setIsLoading] = useState(false);

        useEffect(() => {
            const fetchPreview = async () => {
                setIsLoading(true);
                
                // เตรียมข้อมูลสำหรับส่งไป Gen รูป
                const pText = previewReplacer(imageData.text_content, botInfo.avatar, userProfile, guildProfile, true);
                const userAvatarExt = userProfile?.avatar?.startsWith("a_") ? "gif" : "png";
                const userAvatarUrl = userProfile?.avatar ? `https://cdn.discordapp.com/avatars/${userProfile.id}/${userProfile.avatar}.${userAvatarExt}?size=256` : "https://cdn.discordapp.com/embed/avatars/0.png";
                const username = userProfile?.global_name || userProfile?.username || "User";

                try {
                    const res = await fetch(`${API_URL}/api/announcements/${guildId}/preview_join_image`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            bg_url: imageData.bg_url,
                            text_content: pText,
                            text_color: imageData.text_color,
                            avatar_url: userAvatarUrl,
                            username: username
                        })
                    });

                    if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                    }
                } catch (e) {
                    console.error("Preview failed", e);
                } finally {
                    setIsLoading(false);
                }
            };

            // Debounce เพื่อไม่ให้ยิง request รัวเกินไปตอนพิมพ์
            const timer = setTimeout(() => {
                fetchPreview();
            }, 800);

            return () => clearTimeout(timer);
        }, [imageData, userProfile, guildProfile, guildId, API_URL]);

        return (
            <div className="relative mt-2 max-w-[520px] w-full aspect-[2/1] rounded-lg overflow-hidden border border-[#1e1f22] shadow-md bg-[#232428] flex items-center justify-center">
                {isLoading && (
                    <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
                
                {previewUrl ? (
                    <img src={previewUrl} alt="Welcome Preview" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-[#949ba4] text-xs">กำลังโหลดตัวอย่าง...</div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col pb-12 p-8 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">ตั้งค่าข้อความต้อนรับ</h1>
                    <p className="text-[#949ba4] text-sm">ออกแบบการ์ดต้อนรับของคุณให้สวยงาม</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => toggleSwitch(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                </label>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="lg:w-1/2 w-full flex flex-col gap-4">
                    <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#2e3035] shadow-lg sticky top-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#949ba4] text-xs font-bold uppercase">Live Preview</h3>
                        </div>
                        <EmbedPreview />
                    </div>
                </div>

                <div className="lg:w-1/2 w-full">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">ส่งไปที่ห้อง</label>
                            <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2]">
                                <option value="">-- เลือกห้อง --</option>
                                {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                            </select>
                        </div>

                        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">ข้อความหลัก (นอก Embed/รูปภาพ)</label>
                            <SmartInput 
                                isTextarea={true}
                                value={message} 
                                onChange={setMessage}
                                placeholder="ข้อความทักทาย (พิมพ์ { เพื่อเลือกตัวแปร)"
                                className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] h-20 focus:outline-none focus:border-[#5865f2] resize-y"
                            />
                        </div>

                        <div className="flex items-center justify-between bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <div>
                                <h3 className="text-white font-bold">ใช้งาน Embed Message</h3>
                                <p className="text-[#949ba4] text-xs">เปิดเพื่อใช้รูปแบบการ์ดแบบข้อความ</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>

                        {useEmbed && (
                            <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22] space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1"><ImageInput label="Author Icon URL" value={embedData.author_icon} onChange={(v: string) => handleEmbedChange('author_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                    <div className="flex-1">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Author Name</label>
                                        <SmartInput value={embedData.author_name} onChange={(v: any) => handleEmbedChange('author_name', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22]" placeholder="พิมพ์ { เพื่อเลือกตัวแปร" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Title (หัวข้อ)</label>
                                    <SmartInput value={embedData.title} onChange={(v: any) => handleEmbedChange('title', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] font-bold" placeholder="พิมพ์ { เพื่อเลือกตัวแปร" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase">Description (รายละเอียด)</label>
                                        <span className={`text-xs ${embedData.description.length > 4096 ? 'text-red-500 font-bold' : 'text-[#949ba4]'}`}>{embedData.description.length} / 4096</span>
                                    </div>
                                    <SmartInput 
                                        isTextarea={true} maxLength={4096}
                                        value={embedData.description} onChange={(v: any) => handleEmbedChange('description', v)} 
                                        placeholder="ใส่รายละเอียดการต้อนรับ (พิมพ์ { เพื่อเลือกตัวแปร)"
                                        className={`w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border ${embedData.description.length > 4096 ? 'border-red-500 focus:border-red-500' : 'border-[#1e1f22] focus:border-[#5865f2]'} min-h-[150px] resize-y focus:outline-none whitespace-pre-wrap`}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Embed Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="h-10 w-12 bg-transparent border-none cursor-pointer" />
                                            <input type="text" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] uppercase" />
                                        </div>
                                    </div>
                                    <div><ImageInput label="Thumbnail URL" value={embedData.thumbnail} onChange={(v: string) => handleEmbedChange('thumbnail', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                </div>
                                <ImageInput label="Main Image URL" value={embedData.image} onChange={(v: string) => handleEmbedChange('image', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} />
                                <div className="border-t border-[#1e1f22] pt-4 flex gap-4">
                                    <div className="w-1/3"><ImageInput label="Footer Icon" value={embedData.footer_icon} onChange={(v: string) => handleEmbedChange('footer_icon', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} /></div>
                                    <div className="flex-1">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Footer Text</label>
                                        <SmartInput value={embedData.footer_text} onChange={(v: any) => handleEmbedChange('footer_text', v)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22]" placeholder="พิมพ์ { เพื่อเลือกตัวแปร" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <div>
                                <h3 className="text-white font-bold">ใช้งานรูปภาพต้อนรับ (Welcome Image)</h3>
                                <p className="text-[#949ba4] text-xs">บอทจะส่งรูปภาพสวยๆ แนบไปพร้อมข้อความ</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={useImage} onChange={(e) => setUseImage(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>

                        {useImage && (
                            <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22] space-y-4 animate-in fade-in slide-in-from-top-2">
                                <ImageInput label="URL รูปภาพพื้นหลัง (Background)" value={imageData.bg_url} onChange={(v: string) => handleImageChange('bg_url', v)} botAvatar={botInfo.avatar} userReal={userProfile} guildReal={guildProfile} />
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">ข้อความใต้ชื่อ (Sub-Text)</label>
                                        <SmartInput 
                                            value={imageData.text_content} 
                                            onChange={(v: any) => handleImageChange('text_content', v)} 
                                            className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2]" 
                                            placeholder="พิมพ์ { เพื่อเลือกตัวแปร" 
                                        />
                                    </div>
                                    <div className="sm:w-1/3">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">สีตัวอักษร</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={imageData.text_color} onChange={(e) => handleImageChange('text_color', e.target.value)} className="h-10 w-12 bg-transparent border-none cursor-pointer" />
                                            <input type="text" value={imageData.text_color} onChange={(e) => handleImageChange('text_color', e.target.value)} className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] uppercase focus:outline-none focus:border-[#5865f2]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-[#23a559] hover:bg-[#1f934e] text-white font-bold py-3 rounded transition shadow-lg mt-4">
                            💾 บันทึกการตั้งค่า
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}