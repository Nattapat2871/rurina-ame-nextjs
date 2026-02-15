"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ guildId }: { guildId?: string }) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? "bg-[#3f4147] text-white border-l-4 border-[#5865f2]" : "text-[#dbdee1] hover:bg-[#3f4147] hover:text-white";

    return (
        <div className="w-64 bg-[#2b2d31] flex flex-col border-r border-[#1e1f22] h-full min-h-screen shrink-0">
            <div className="p-5 font-bold text-white text-lg border-b border-[#1e1f22]">
                🤖 Rurina-Ame
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
                <Link href="/dashboard" className="px-5 py-3 block text-[#949ba4] hover:bg-[#3f4147] hover:text-white transition">
                    🏠 เซิร์ฟเวอร์ทั้งหมด
                </Link>

                {guildId && (
                    <>
                        <div className="my-2 mx-4 border-t border-[#3f4147]" />
                        <div className="px-5 py-2 text-xs font-bold text-[#949ba4] uppercase">MESSAGING</div>
                        
                        <Link href={`/dashboard/${guildId}/announcements`} className={`px-5 py-2 block transition ${isActive(`/dashboard/${guildId}/announcements`)}`}>
                            📢 Announcements
                        </Link>
                        
                        <Link href={`/dashboard/${guildId}/announcements/join`} className={`pl-10 pr-5 py-2 block text-sm transition ${isActive(`/dashboard/${guildId}/announcements/join`)}`}>
                            Join Message
                        </Link>
                    </>
                )}
            </div>
            
            <div className="p-4 border-t border-[#1e1f22] text-xs text-[#949ba4] text-center">
                v1.0.0 Dashboard
            </div>
        </div>
    );
}