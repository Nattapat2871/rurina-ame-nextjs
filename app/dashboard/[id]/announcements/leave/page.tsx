"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function LeaveSettingsPage() {
    const params = useParams();
    const guildId = params.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannel, setSelectedChannel] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        // ดึงรายชื่อห้อง
        fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setChannels(data.channels || []));

        // ดึงการตั้งค่าปัจจุบัน (เปลี่ยนมาใช้ค่า leave_*)
        fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setSelectedChannel(data.leave_channel_id);
                setMessage(data.leave_message);
            });
    }, [guildId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        // เรียก API save_leave
        const res = await fetch(`${API_URL}/api/announcements/${guildId}/save_leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channel_id: selectedChannel, message: message }),
            credentials: 'include'
        });
        const result = await res.json();
        
        if (result.status === 'success') {
            Swal.fire({
                title: 'บันทึกสำเร็จ!',
                text: 'อัปเดตการตั้งค่า Leave Message เรียบร้อยแล้วค่ะ',
                icon: 'success',
                background: '#2b2d31',
                color: '#dbdee1',
                confirmButtonColor: '#5865f2'
            });
        }
    };

    return (
        <div className="max-w-2xl">
            <h1 className="text-xl font-bold text-white mb-6">ตั้งค่าข้อความคนออก (Leave Message)</h1>
            <form onSubmit={handleSave} className="bg-[#2b2d31] p-8 rounded-xl border border-[#1e1f22]">
                <label className="block text-[#b5bac1] font-bold mb-2">เลือกห้องสำหรับแจ้งเตือน:</label>
                <select 
                    value={selectedChannel} 
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded-md border-none focus:ring-2 focus:ring-[#5865f2] mb-6"
                    required
                >
                    <option value="" disabled>-- เลือกห้องแชท --</option>
                    {channels.map(c => (
                        <option key={c.id} value={c.id}># {c.name}</option>
                    ))}
                </select>

                <label className="block text-[#b5bac1] font-bold mb-2">ข้อความแจ้งเตือน:</label>
                <div className="bg-[#1e1f22] p-3 rounded-md mb-4 text-xs text-[#949ba4]">
                    💡 <b>ตัวแปรที่ใช้ได้:</b> <code>{'{user}'}</code> = ชื่อคนออก, <code>{'{server}'}</code> = ชื่อเซิร์ฟเวอร์
                </div>
                <input 
                    type="text" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#1e1f22] text-[#dbdee1] p-3 rounded-md border-none focus:ring-2 focus:ring-[#5865f2] mb-6"
                    required 
                />

                <button type="submit" className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 rounded transition">
                    บันทึกการตั้งค่า
                </button>
            </form>
        </div>
    );
}