"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LogIn, LogOut, Settings, Zap } from 'lucide-react'; // ✅ เพิ่ม icon Zap (สายฟ้า)

export default function AnnouncementsPage() {
  const { id } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  const [joinEnabled, setJoinEnabled] = useState<boolean>(false);
  const [leaveEnabled, setLeaveEnabled] = useState<boolean>(false);
  const [boostEnabled, setBoostEnabled] = useState<boolean>(false); // ✅ เพิ่ม State Boost
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [joinRes, leaveRes, boostRes] = await Promise.all([
          fetch(`${API_URL}/api/announcements/${id}/status`, { credentials: 'include' }),
          fetch(`${API_URL}/api/announcements/${id}/leave_status`, { credentials: 'include' }),
          fetch(`${API_URL}/api/announcements/${id}/boost_status`, { credentials: 'include' }) // ✅ Fetch Boost
        ]);

        if (joinRes.ok) { const joinData = await joinRes.json(); setJoinEnabled(!!joinData.is_welcome_enabled); }
        if (leaveRes.ok) { const leaveData = await leaveRes.json(); setLeaveEnabled(!!leaveData.is_welcome_enabled); }
        if (boostRes.ok) { const boostData = await boostRes.json(); setBoostEnabled(!!boostData.is_welcome_enabled); }
      } catch (err) {
        console.error("Failed to fetch statuses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, API_URL]);

  const toggleJoin = async (checked: boolean) => {
    setJoinEnabled(checked);
    try { await fetch(`${API_URL}/api/announcements/${id}/toggle_join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: checked }), credentials: 'include', }); } catch { setJoinEnabled(!checked); }
  };

  const toggleLeave = async (checked: boolean) => {
    setLeaveEnabled(checked);
    try { await fetch(`${API_URL}/api/announcements/${id}/toggle_leave`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: checked }), credentials: 'include', }); } catch { setLeaveEnabled(!checked); }
  };

  // ✅ เพิ่มฟังก์ชัน Toggle Boost
  const toggleBoost = async (checked: boolean) => {
    setBoostEnabled(checked);
    try { await fetch(`${API_URL}/api/announcements/${id}/toggle_boost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: checked }), credentials: 'include', }); } catch { setBoostEnabled(!checked); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-primary animate-pulse-soft">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto opacity-0 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Announcement Settings</h1>
        <p className="text-secondary">จัดการข้อความต้อนรับ คำอำลา และการบูสต์เซิร์ฟเวอร์</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ✅ Welcome Card */}
        <div className="bg-card backdrop-blur-md rounded-3xl border border-border overflow-hidden hover:border-primary transition-all duration-300 shadow-lg hover:shadow-primary/20 group opacity-0 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="p-6 relative">
             <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"><LogIn className="w-24 h-24 text-primary" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-4"><div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors border border-primary/20"><LogIn className="w-6 h-6 text-primary" /></div><div><h2 className="text-xl font-bold text-foreground">Welcome</h2><p className="text-secondary text-xs md:text-sm mt-1">ข้อความเมื่อมีคนเข้า</p></div></div>
              <label className="relative inline-flex items-center cursor-pointer scale-110"><input type="checkbox" className="sr-only peer" checked={joinEnabled} onChange={(e) => toggleJoin(e.target.checked)} /><div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div></label>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end relative z-10"><Link href={`/dashboard/${id}/announcements/join`} className="flex items-center gap-2 px-5 py-2.5 bg-secondary/30 hover:bg-primary text-foreground hover:text-white border border-border hover:border-primary rounded-xl transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group/btn"><Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" /> ตั้งค่า</Link></div>
          </div>
        </div>

        {/* ✅ Leave Card */}
        <div className="bg-card backdrop-blur-md rounded-3xl border border-border overflow-hidden hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-red-500/20 group opacity-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
           <div className="p-6 relative">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"><LogOut className="w-24 h-24 text-red-500" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-4"><div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors border border-red-500/20"><LogOut className="w-6 h-6 text-red-500" /></div><div><h2 className="text-xl font-bold text-foreground">Leave</h2><p className="text-secondary text-xs md:text-sm mt-1">ข้อความเมื่อมีคนออก</p></div></div>
              <label className="relative inline-flex items-center cursor-pointer scale-110"><input type="checkbox" className="sr-only peer" checked={leaveEnabled} onChange={(e) => toggleLeave(e.target.checked)} /><div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 peer-checked:shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div></label>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end relative z-10"><Link href={`/dashboard/${id}/announcements/leave`} className="flex items-center gap-2 px-5 py-2.5 bg-secondary/30 hover:bg-red-500 text-foreground hover:text-white border border-border hover:border-red-500 rounded-xl transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group/btn"><Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" /> ตั้งค่า</Link></div>
          </div>
        </div>

        {/* ✅ Boost Card (เพิ่มใหม่) */}
        <div className="bg-card backdrop-blur-md rounded-3xl border border-border overflow-hidden hover:border-[#FF73FA] transition-all duration-300 shadow-lg hover:shadow-[#FF73FA]/20 group opacity-0 animate-scale-in" style={{ animationDelay: '0.3s' }}>
           <div className="p-6 relative">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500"><Zap className="w-24 h-24 text-[#FF73FA]" /></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-4"><div className="p-3 bg-[#FF73FA]/10 rounded-xl group-hover:bg-[#FF73FA]/20 transition-colors border border-[#FF73FA]/20"><Zap className="w-6 h-6 text-[#FF73FA]" /></div><div><h2 className="text-xl font-bold text-foreground">Server Boost</h2><p className="text-secondary text-xs md:text-sm mt-1">ข้อความเมื่อมีการ Boost</p></div></div>
              <label className="relative inline-flex items-center cursor-pointer scale-110"><input type="checkbox" className="sr-only peer" checked={boostEnabled} onChange={(e) => toggleBoost(e.target.checked)} /><div className="w-11 h-6 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF73FA] peer-checked:shadow-[0_0_10px_rgba(255,115,250,0.5)]"></div></label>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end relative z-10"><Link href={`/dashboard/${id}/announcements/boost`} className="flex items-center gap-2 px-5 py-2.5 bg-secondary/30 hover:bg-[#FF73FA] text-foreground hover:text-white border border-border hover:border-[#FF73FA] rounded-xl transition-all duration-300 text-sm font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95 group/btn"><Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" /> ตั้งค่า</Link></div>
          </div>
        </div>

      </div>
    </div>
  );
}