"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';

// --- Helper Functions ---
const parseMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
            return <a key={index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-[#00b0f4] hover:underline cursor-pointer">{match[1]}</a>;
        }
        return part;
    });
};

// ฟังก์ชันแปลงตัวแปรสำหรับ Preview (จำลองข้อมูล)
const previewReplacer = (text: string, botAvatar: string) => {
    if (!text) return "";
    let msg = text;

    // จำลอง User
    msg = msg.replace(/{user}/g, "@User");
    msg = msg.replace(/{user.mention}/g, "@User");
    msg = msg.replace(/{user.username}/g, "User1234");
    msg = msg.replace(/{user.id}/g, "123456789012345678");
    msg = msg.replace(/{user.avatar}/g, botAvatar); // ใช้รูปบอทแทน

    // จำลอง Server
    msg = msg.replace(/{server}/g, "My Awesome Server");
    msg = msg.replace(/{server.name}/g, "My Awesome Server");
    msg = msg.replace(/{server.id}/g, "987654321098765432");
    msg = msg.replace(/{server.icon}/g, "https://cdn.discordapp.com/embed/avatars/1.png"); // รูปสมมติ

    // จำลอง Utility
    msg = msg.replace(/{membercount}/g, "150");
    msg = msg.replace(/{membercount.ordinal}/g, "150th");
    
    // Regex
    msg = msg.replace(/\{#(.*?)\}/g, "#$1");
    msg = msg.replace(/\{@(.*?) \}/g, "@$1");
    msg = msg.replace(/\{:(.*?)\}/g, ":$1:");

    return msg;
};

const ImageInput = ({ label, value, onChange, botAvatar }: any) => {
    const [preview, setPreview] = useState("");

    useEffect(() => {
        if (!value) { 
            setPreview(""); 
            return; 
        }

        // ถ้าเป็นตัวแปร ให้แสดงรูปจำลองทันที
        if (value.includes("{")) {
            const simulatedUrl = previewReplacer(value, botAvatar);
            setPreview(simulatedUrl);
            return;
        }

        // ถ้าเป็น URL ปกติ ให้ลองโหลด
        const img = new Image();
        img.src = value;
        img.onload = () => setPreview(value);
        img.onerror = () => setPreview(""); // ถ้าโหลดไม่ได้ไม่ต้องโชว์ (หรือโชว์รูป Broken ก็ได้)
    }, [value, botAvatar]);

    return (
        <div className="mb-4">
            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">{label}</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://... หรือ {user.avatar}"
                    className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] text-sm focus:outline-none focus:border-[#5865f2]"
                />
                {preview && (
                    <div className="relative group">
                        <img src={preview} className="w-8 h-8 rounded object-cover border border-[#1e1f22]" />
                        {/* Tooltip บอกว่าเป็นรูปจำลอง */}
                        {value.includes("{") && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-xs text-white p-1 rounded whitespace-nowrap">
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
    const [selectedChannel, setSelectedChannel] = useState("");
    const [message, setMessage] = useState("");
    const [isEnabled, setIsEnabled] = useState(false);
    
    // Bot Info
    const [botInfo, setBotInfo] = useState({ name: "Bot", avatar: "https://cdn.discordapp.com/embed/avatars/0.png" });
    
    // Embed State
    const [useEmbed, setUseEmbed] = useState(false);
    const [embedData, setEmbedData] = useState({
        author_name: "", author_icon: "",
        title: "", description: "", url: "",
        color: "#5865f2",
        thumbnail: "", image: "",
        footer_text: "", footer_icon: "",
        timestamp_mode: "none",
        custom_timestamp: ""
    });

    useEffect(() => {
        fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setChannels(data.channels || []));

        fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.bot_avatar) setBotInfo({ name: data.bot_name, avatar: data.bot_avatar });
                setSelectedChannel(data.welcome_channel_id);
                setMessage(data.welcome_message);
                setIsEnabled(data.is_welcome_enabled);
                setUseEmbed(data.use_embed);
                if (data.embed_data && Object.keys(data.embed_data).length > 0) {
                    setEmbedData({ 
                        ...embedData, 
                        ...data.embed_data,
                        timestamp_mode: data.embed_data.timestamp_mode || (data.embed_data.timestamp ? 'now' : 'none')
                    });
                }
            });
    }, [guildId, API_URL]);

    const handleEmbedChange = (key: string, value: any) => {
        setEmbedData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            channel_id: selectedChannel,
            message: message,
            use_embed: useEmbed,
            embed_data: embedData
        };

        const res = await fetch(`${API_URL}/api/announcements/${guildId}/save_join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        if (res.ok) {
            Swal.fire({
                title: 'บันทึกสำเร็จ!',
                icon: 'success',
                background: '#2b2d31',
                color: '#dbdee1',
                confirmButtonColor: '#5865f2',
                timer: 1500
            });
        }
    };

    const toggleSwitch = async (checked: boolean) => {
        setIsEnabled(checked);
        await fetch(`${API_URL}/api/announcements/${guildId}/toggle_join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: checked }),
            credentials: 'include'
        });
    };

    // --- Show Variables Guide (Modal) ---
    const showVariablesGuide = () => {
        Swal.fire({
            title: '📜 ตัวแปรที่ใช้ได้ (Variables)',
            html: `
                <div style="text-align: left; font-size: 0.9em; max-height: 400px; overflow-y: auto;">
                    <h3 style="color: #5865f2; font-weight: bold; margin-top: 10px;">👤 User (ผู้เข้าใช้งาน)</h3>
                    <ul style="list-style: disc; padding-left: 20px; color: #dbdee1;">
                        <li><code>{user}</code> - แท็กชื่อ (@User)</li>
                        <li><code>{user.mention}</code> - แท็กชื่อ</li>
                        <li><code>{user.username}</code> - ชื่อ Username</li>
                        <li><code>{user.id}</code> - ไอดีผู้ใช้</li>
                        <li><code>{user.avatar}</code> - ลิงก์รูปโปรไฟล์ (ใช้ใส่ในช่องรูปได้)</li>
                    </ul>

                    <h3 style="color: #23a559; font-weight: bold; margin-top: 15px;">🏰 Server (เซิร์ฟเวอร์)</h3>
                    <ul style="list-style: disc; padding-left: 20px; color: #dbdee1;">
                        <li><code>{server.name}</code> - ชื่อเซิร์ฟเวอร์</li>
                        <li><code>{server.id}</code> - ไอดีเซิร์ฟเวอร์</li>
                        <li><code>{server.icon}</code> - ลิงก์รูปไอคอนเซิร์ฟเวอร์ (ใช้ใส่ในช่องรูปได้)</li>
                    </ul>

                    <h3 style="color: #f0b232; font-weight: bold; margin-top: 15px;">🔧 Utility (อื่นๆ)</h3>
                    <ul style="list-style: disc; padding-left: 20px; color: #dbdee1;">
                        <li><code>{membercount}</code> - จำนวนคนทั้งหมด</li>
                        <li><code>{membercount.ordinal}</code> - ลำดับคนที่ (ex. 150th)</li>
                        <li><code>{#channel}</code> - แท็กห้อง (เปลี่ยน channel เป็นชื่อห้อง/ID)</li>
                        <li><code>{@role}</code> - แท็กยศ (เปลี่ยน role เป็นชื่อยศ/ID)</li>
                        <li><code>{:emoji}</code> - แสดงอีโมจิ (เปลี่ยน emoji เป็นชื่อ/ID)</li>
                    </ul>
                </div>
            `,
            background: '#2b2d31',
            color: '#dbdee1',
            confirmButtonText: 'ปิดหน้าต่าง',
            confirmButtonColor: '#5865f2',
            width: '600px'
        });
    };

    const getPreviewTime = () => {
        let date = new Date();
        if (embedData.timestamp_mode === 'custom' && embedData.custom_timestamp) {
            date = new Date(embedData.custom_timestamp);
        }
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const isToday = new Date().toDateString() === date.toDateString();
        if (isToday) return `Today at ${timeStr}`;
        return `${date.toLocaleDateString('en-US')} at ${timeStr}`;
    };

    // --- PREVIEW ---
    const EmbedPreview = () => {
        // Prepare Simulated Data for Preview
        const pTitle = previewReplacer(embedData.title, botInfo.avatar);
        const pDesc = previewReplacer(embedData.description, botInfo.avatar);
        const pAuthorName = previewReplacer(embedData.author_name, botInfo.avatar);
        const pAuthorIcon = previewReplacer(embedData.author_icon, botInfo.avatar);
        const pFooterText = previewReplacer(embedData.footer_text, botInfo.avatar);
        const pFooterIcon = previewReplacer(embedData.footer_icon, botInfo.avatar);
        const pThumbnail = previewReplacer(embedData.thumbnail, botInfo.avatar);
        const pImage = previewReplacer(embedData.image, botInfo.avatar);
        const pMessage = previewReplacer(message, botInfo.avatar);

        return (
            <div className="bg-[#313338] p-4 rounded-lg font-sans text-[#dbdee1] max-w-full">
                <div className="flex items-start gap-3">
                    <img 
                        src={botInfo.avatar} 
                        className="w-10 h-10 rounded-full hover:opacity-80 transition cursor-pointer object-cover"
                        alt="Bot Avatar"
                    />
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="font-medium text-white hover:underline cursor-pointer">{botInfo.name}</span>
                            <span className="bg-[#5865f2] text-white text-[10px] px-1 rounded h-4 flex items-center">BOT</span>
                            <span className="text-xs text-[#949ba4] ml-1">{getPreviewTime()}</span>
                        </div>
                        
                        {pMessage && <div className="mt-1 whitespace-pre-wrap text-sm">{parseMarkdown(pMessage)}</div>}

                        {useEmbed && (
                            <div className="mt-2 bg-[#2b2d31] rounded flex max-w-[520px] border-l-4" style={{ borderColor: embedData.color }}>
                                <div className="p-4 grid gap-2 w-full">
                                    {pAuthorName && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                                            {pAuthorIcon && <img src={pAuthorIcon} className="w-6 h-6 rounded-full object-cover" />}
                                            <span>{pAuthorName}</span>
                                        </div>
                                    )}
                                    
                                    {pTitle && <div className="font-bold text-white text-base">{parseMarkdown(pTitle)}</div>}
                                    
                                    {pDesc && <div className="text-sm text-[#dbdee1] whitespace-pre-wrap">{parseMarkdown(pDesc)}</div>}
                                    
                                    {pImage && <img src={pImage} className="w-full rounded mt-2 object-cover max-h-[300px]" />}

                                    {(pFooterText || embedData.timestamp_mode !== 'none') && (
                                        <div className="flex items-center gap-2 text-xs text-[#949ba4] mt-1">
                                            {pFooterIcon && <img src={pFooterIcon} className="w-5 h-5 rounded-full" />}
                                            <span>
                                                {pFooterText}
                                                {pFooterText && embedData.timestamp_mode !== 'none' && " • "}
                                                {embedData.timestamp_mode !== 'none' && getPreviewTime()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {pThumbnail && (
                                    <div className="p-4 pl-0">
                                        <img src={pThumbnail} className="w-20 h-20 rounded object-cover" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">ตั้งค่าข้อความต้อนรับ</h1>
                    <p className="text-[#949ba4] text-sm">ออกแบบการ์ดต้อนรับของคุณให้สวยงาม</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => toggleSwitch(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                    <span className="ml-3 text-sm font-medium text-[#dbdee1]">{isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                </label>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                <div className="lg:w-1/2 flex flex-col gap-4">
                    <div className="bg-[#1e1f22] p-4 rounded-xl border border-[#2e3035] shadow-lg sticky top-0">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#949ba4] text-xs font-bold uppercase">Live Preview</h3>
                            {/* 🔥 ปุ่มดูตัวแปร */}
                            <button 
                                onClick={showVariablesGuide}
                                className="text-xs bg-[#5865f2] hover:bg-[#4752c4] text-white px-2 py-1 rounded transition flex items-center gap-1"
                            >
                                ℹ️ ดูตัวแปร
                            </button>
                        </div>
                        <EmbedPreview />
                    </div>
                </div>

                <div className="lg:w-1/2 overflow-y-auto pr-2 custom-scrollbar">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">ส่งไปที่ห้อง</label>
                            <select 
                                value={selectedChannel} 
                                onChange={(e) => setSelectedChannel(e.target.value)}
                                className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] focus:outline-none focus:border-[#5865f2]"
                            >
                                <option value="">-- เลือกห้อง --</option>
                                {channels.map(c => <option key={c.id} value={c.id}># {c.name}</option>)}
                            </select>
                        </div>

                        <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <div className="flex justify-between mb-2">
                                <label className="block text-[#b5bac1] text-xs font-bold uppercase">ข้อความหลัก (นอก Embed)</label>
                                <span className="text-[#949ba4] text-xs cursor-pointer hover:text-white" onClick={showVariablesGuide}>ℹ️ ตัวแปร</span>
                            </div>
                            <textarea 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="ข้อความทักทาย (ใช้ {user} ได้)"
                                className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded border border-[#1e1f22] h-20 focus:outline-none focus:border-[#5865f2]"
                            />
                        </div>

                        <div className="flex items-center justify-between bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22]">
                            <div>
                                <h3 className="text-white font-bold">ใช้งาน Embed Message</h3>
                                <p className="text-[#949ba4] text-xs">เปิดเพื่อใช้รูปแบบการ์ดสวยงาม</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={useEmbed} onChange={(e) => setUseEmbed(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#5865f2] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>

                        {useEmbed && (
                            <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#1e1f22] space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        {/* 🔥 ImageInput รองรับ Bot Avatar */}
                                        <ImageInput label="Author Icon URL" value={embedData.author_icon} onChange={(v: string) => handleEmbedChange('author_icon', v)} botAvatar={botInfo.avatar} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Author Name</label>
                                        <input type="text" value={embedData.author_name} onChange={(e) => handleEmbedChange('author_name', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22]" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Title (หัวข้อ)</label>
                                    <input type="text" value={embedData.title} onChange={(e) => handleEmbedChange('title', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] font-bold" />
                                </div>

                                <div>
                                    <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Description (รายละเอียด)</label>
                                    <textarea value={embedData.description} onChange={(e) => handleEmbedChange('description', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] h-24" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Embed Color</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="h-10 w-12 bg-transparent border-none cursor-pointer" />
                                            <input type="text" value={embedData.color} onChange={(e) => handleEmbedChange('color', e.target.value)} className="flex-1 bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] uppercase" />
                                        </div>
                                    </div>
                                    <div>
                                         <ImageInput label="Thumbnail URL" value={embedData.thumbnail} onChange={(v: string) => handleEmbedChange('thumbnail', v)} botAvatar={botInfo.avatar} />
                                    </div>
                                </div>

                                <ImageInput label="Main Image URL" value={embedData.image} onChange={(v: string) => handleEmbedChange('image', v)} botAvatar={botInfo.avatar} />

                                <div className="border-t border-[#1e1f22] pt-4">
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <ImageInput label="Footer Icon" value={embedData.footer_icon} onChange={(v: string) => handleEmbedChange('footer_icon', v)} botAvatar={botInfo.avatar} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Footer Text</label>
                                            <input type="text" value={embedData.footer_text} onChange={(e) => handleEmbedChange('footer_text', e.target.value)} className="w-full bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22]" />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-[#b5bac1] text-xs font-bold uppercase mb-2">Timestamp Settings</label>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="ts_mode" 
                                                        checked={embedData.timestamp_mode === 'none'} 
                                                        onChange={() => handleEmbedChange('timestamp_mode', 'none')} 
                                                        className="text-[#5865f2]" />
                                                    <span className="text-[#dbdee1] text-sm">ไม่แสดง</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="ts_mode" 
                                                        checked={embedData.timestamp_mode === 'now'} 
                                                        onChange={() => handleEmbedChange('timestamp_mode', 'now')} 
                                                        className="text-[#5865f2]" />
                                                    <span className="text-[#dbdee1] text-sm">เวลาปัจจุบัน</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name="ts_mode" 
                                                        checked={embedData.timestamp_mode === 'custom'} 
                                                        onChange={() => handleEmbedChange('timestamp_mode', 'custom')} 
                                                        className="text-[#5865f2]" />
                                                    <span className="text-[#dbdee1] text-sm">กำหนดเวลาเอง</span>
                                                </label>
                                            </div>

                                            {embedData.timestamp_mode === 'custom' && (
                                                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                                    <input 
                                                        type="datetime-local" 
                                                        value={embedData.custom_timestamp}
                                                        onChange={(e) => handleEmbedChange('custom_timestamp', e.target.value)}
                                                        className="bg-[#1e1f22] text-[#dbdee1] p-2 rounded border border-[#1e1f22] text-sm w-full"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-[#23a559] hover:bg-[#1f934e] text-white font-bold py-3 rounded transition shadow-lg">
                            💾 บันทึกการตั้งค่า
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}