"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, LogOut, Settings } from 'lucide-react';

export default function AnnouncementsPage() {
  const { id } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  const [joinEnabled, setJoinEnabled] = useState<boolean>(false);
  const [leaveEnabled, setLeaveEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [joinRes, leaveRes] = await Promise.all([
          fetch(`${API_URL}/api/announcements/${id}/status`, { credentials: 'include' }),
          fetch(`${API_URL}/api/announcements/${id}/leave_status`, { credentials: 'include' })
        ]);

        if (joinRes.ok) {
          const joinData = await joinRes.json();
          setJoinEnabled(!!joinData.is_welcome_enabled);
        }

        if (leaveRes.ok) {
          const leaveData = await leaveRes.json();
          setLeaveEnabled(!!leaveData.is_welcome_enabled); 
        }
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
    try {
      await fetch(`${API_URL}/api/announcements/${id}/toggle_join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
        credentials: 'include',
      });
    } catch (error) {
      setJoinEnabled(!checked);
    }
  };

  const toggleLeave = async (checked: boolean) => {
    setLeaveEnabled(checked);
    try {
      await fetch(`${API_URL}/api/announcements/${id}/toggle_leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
        credentials: 'include',
      });
    } catch (error) {
      setLeaveEnabled(!checked);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-[#949ba4] animate-pulse-soft">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto opacity-0 animate-slide-down">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Announcement Settings</h1>
        <p className="text-[#949ba4]">จัดการข้อความต้อนรับและคำอำลาสำหรับเซิร์ฟเวอร์ของคุณ</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ✅ Welcome Card */}
        <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden hover:border-[#5865f2] transition-colors duration-300 shadow-lg group opacity-0 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#23a559]/10 rounded-lg group-hover:bg-[#23a559]/20 transition-colors">
                    <LogIn className="w-6 h-6 text-[#23a559]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Welcome Message</h2>
                  <p className="text-[#949ba4] text-xs md:text-sm mt-1">ส่งข้อความเมื่อมีคนเข้าเซิร์ฟเวอร์</p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer scale-110">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={joinEnabled} 
                  onChange={(e) => toggleJoin(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
              </label>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#3f4147] flex justify-end">
              <Link 
                href={`/dashboard/${id}/announcements/join`}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                <Settings className="w-4 h-4" /> ตั้งค่า (Config)
              </Link>
            </div>
          </div>
        </div>

        {/* ✅ Leave Card */}
        <div className="bg-[#2b2d31] rounded-xl border border-[#1e1f22] overflow-hidden hover:border-[#fa5252] transition-colors duration-300 shadow-lg group opacity-0 animate-scale-in" style={{ animationDelay: '0.2s' }}>
           <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#fa5252]/10 rounded-lg group-hover:bg-[#fa5252]/20 transition-colors">
                    <LogOut className="w-6 h-6 text-[#fa5252]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Leave Message</h2>
                  <p className="text-[#949ba4] text-xs md:text-sm mt-1">ส่งข้อความเมื่อมีคนออกจากเซิร์ฟเวอร์</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer scale-110">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={leaveEnabled} 
                  onChange={(e) => toggleLeave(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fa5252]"></div>
              </label>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#3f4147] flex justify-end">
              <Link 
                href={`/dashboard/${id}/announcements/leave`}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                <Settings className="w-4 h-4" /> ตั้งค่า (Config)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}