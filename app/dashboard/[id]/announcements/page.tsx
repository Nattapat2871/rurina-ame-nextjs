"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function AnnouncementsPage() {
    const params = useParams();
    const guildId = params.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // แยก State สำหรับ Join และ Leave
    const [joinEnabled, setJoinEnabled] = useState(false);
    const [leaveEnabled, setLeaveEnabled] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/announcements/${guildId}/status`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setJoinEnabled(data.is_welcome_enabled);
                setLeaveEnabled(data.is_leave_enabled);
            });
    }, [guildId]);

    // ฟังก์ชัน Toggle แยกกัน
    const toggleJoin = async (checked: boolean) => {
        setJoinEnabled(checked);
        await fetch(`${API_URL}/api/announcements/${guildId}/toggle_join`, { // แก้ URL เป็น toggle_join
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: checked }),
            credentials: 'include'
        });
    };

    const toggleLeave = async (checked: boolean) => {
        setLeaveEnabled(checked);
        await fetch(`${API_URL}/api/announcements/${guildId}/toggle_leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: checked }),
            credentials: 'include'
        });
    };

    return (
        <div className="text-[#dbdee1]">
            <h1 className="text-2xl font-bold text-white mb-2">Announcements</h1>
            <p className="text-[#b5bac1] mb-8">ตั้งค่าระบบแจ้งเตือนต่างๆ ภายในเซิร์ฟเวอร์</p>

            {/* การ์ด Join Message */}
            <div className="bg-[#2b2d31] rounded-lg p-6 border border-[#1e1f22] flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-white font-bold text-lg mb-1">👋 Join Message</h3>
                    <p className="text-[#b5bac1] text-sm">ส่งข้อความต้อนรับ เมื่อมีสมาชิกใหม่เข้ามาในเซิร์ฟเวอร์</p>
                </div>
                <div className="flex items-center gap-6">
                    <Link href={`/dashboard/${guildId}/announcements/join`} className="text-[#5865f2] hover:underline font-bold text-sm">
                        ตั้งค่า ⚙️
                    </Link>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={joinEnabled} onChange={(e) => toggleJoin(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                    </label>
                </div>
            </div>

            {/* การ์ด Leave Message (เพิ่มใหม่) */}
            <div className="bg-[#2b2d31] rounded-lg p-6 border border-[#1e1f22] flex justify-between items-center">
                <div>
                    <h3 className="text-white font-bold text-lg mb-1">😢 Leave Message</h3>
                    <p className="text-[#b5bac1] text-sm">แจ้งเตือนเมื่อมีสมาชิกออกจากเซิร์ฟเวอร์</p>
                </div>
                <div className="flex items-center gap-6">
                    <Link href={`/dashboard/${guildId}/announcements/leave`} className="text-[#5865f2] hover:underline font-bold text-sm">
                        ตั้งค่า ⚙️
                    </Link>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={leaveEnabled} onChange={(e) => toggleLeave(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                    </label>
                </div>
            </div>
        </div>
    );
}