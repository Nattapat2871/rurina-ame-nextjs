"use client";
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProfileMenu from '@/components/ProfileMenu'; // 👈 นำเข้าตรงนี้ด้วยค่ะ
import { useParams } from 'next/navigation';

const LoadingView = () => (
    <div className="flex-1 p-10 animate-pulse">
        <div className="h-8 bg-[#3f4147] rounded w-1/4 mb-6"></div>
        <div className="bg-[#2b2d31] rounded-lg p-6 border border-[#1e1f22] h-40 mb-4"></div>
        <div className="bg-[#2b2d31] rounded-lg p-6 border border-[#1e1f22] h-20"></div>
        <div className="mt-4 text-[#949ba4] text-sm text-center">กำลังเชื่อมต่อกับเซิร์ฟเวอร์... 📡</div>
    </div>
);

const InviteView = ({ inviteUrl }: { inviteUrl: string }) => (
    <div className="flex-1 flex items-center justify-center text-center p-4">
        <div className="max-w-md bg-[#2b2d31] p-8 rounded-xl border border-[#1e1f22] shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">อ๊ะ! บอทยังไม่อยู่ในเซิร์ฟเวอร์ 😅</h2>
            <p className="text-[#949ba4] mb-6">รบกวนเชิญบอทเข้าเซิร์ฟเวอร์ก่อน เพื่อเริ่มตั้งค่านะคะ</p>
            <a href={inviteUrl} target="_blank" className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 px-8 rounded transition inline-block w-full">
                + เชิญบอทเข้าเซิร์ฟเวอร์
            </a>
            <p className="mt-6 text-[#23a559] text-sm animate-pulse flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-[#23a559] rounded-full"></span> 
                กำลังรอรับบอทเข้าเซิร์ฟเวอร์...
            </p>
        </div>
    </div>
);

export default function GuildLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const guildId = params.id as string;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    const [isBotInGuild, setIsBotInGuild] = useState<boolean | null>(null);
    const [inviteUrl, setInviteUrl] = useState("");

    useEffect(() => {
        const checkBot = async () => {
            try {
                const res = await fetch(`${API_URL}/api/guilds/${guildId}/check_bot`, { credentials: 'include' });
                if (!res.ok) return;
                
                const data = await res.json();
                if (data.in_guild) {
                    setIsBotInGuild(true);
                } else {
                    setIsBotInGuild(false);
                    setInviteUrl(data.invite_url);
                }
            } catch (e) {
                console.error("Check bot error:", e);
            }
        };

        checkBot();
        const interval = setInterval(() => {
            if (isBotInGuild === false) checkBot();
        }, 3000);

        return () => clearInterval(interval);
    }, [guildId, isBotInGuild, API_URL]);

    return (
        <div className="flex bg-[#313338] min-h-screen font-sans overflow-hidden">
            <Sidebar guildId={guildId} />
            
            {/* 👇 จัดโครงสร้างแบบเดียวกับหน้าแรกเป๊ะเลยค่ะ */}
            <div className="flex-1 flex flex-col h-screen relative">
                
                {/* 👇 แถบ Header ด้านบนสุด */}
                <div className="h-16 border-b border-[#1e1f22] flex justify-end items-center px-8 shrink-0 bg-[#313338] z-10">
                    <ProfileMenu />
                </div>

                {/* ส่วนเนื้อหา */}
                {isBotInGuild === null ? (
                    <LoadingView />
                ) : isBotInGuild === false ? (
                    <InviteView inviteUrl={inviteUrl} />
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}