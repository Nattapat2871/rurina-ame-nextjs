"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function AnnouncementsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // 🔥 [แก้จุดที่ 2] กำหนดค่าเริ่มต้นเป็น false (ห้ามปล่อยว่าง/undefined)
  const [joinEnabled, setJoinEnabled] = useState<boolean>(false);
  const [leaveEnabled, setLeaveEnabled] = useState<boolean>(false); // สมมติว่ามี leave ด้วย
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch Status
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/api/announcements/${id}/status`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch status");
        return res.json();
      })
      .then((data) => {
        // อัปเดต state จากข้อมูลจริง
        setJoinEnabled(!!data.is_welcome_enabled);
        setLeaveEnabled(!!data.is_leave_enabled); // ถ้ามี key นี้
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, API_URL]);

  const toggleJoin = async (checked: boolean) => {
    // Optimistic Update: เปลี่ยน UI ทันทีไม่ต้องรอเซิร์ฟเวอร์
    setJoinEnabled(checked);
    
    try {
      const res = await fetch(`${API_URL}/api/announcements/${id}/toggle_join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
        credentials: 'include',
      });
      if (!res.ok) {
        // ถ้าพังให้เปลี่ยนกลับ
        setJoinEnabled(!checked);
        console.error("Toggle failed");
      }
    } catch (error) {
      setJoinEnabled(!checked);
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading settings...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Announcement Settings</h1>
      
      <div className="grid gap-6">
        {/* Welcome Card */}
        <div className="bg-[#2f3136] p-6 rounded-lg shadow-md border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Welcome Message</h2>
              <p className="text-gray-400 text-sm">Send a message when a user joins the server.</p>
            </div>
            
            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={joinEnabled} 
                onChange={(e) => toggleJoin(e.target.checked)} 
              />
              <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <div className="flex justify-end">
            <Link 
              href={`/dashboard/${id}/announcements/join`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition"
            >
              Edit Config
            </Link>
          </div>
        </div>

        {/* Leave Card (Optional - ใส่เผื่อไว้ให้) */}
        <div className="bg-[#2f3136] p-6 rounded-lg shadow-md border border-gray-700 opacity-50 cursor-not-allowed">
           <div className="flex justify-between items-center">
             <div>
               <h2 className="text-xl font-semibold text-white">Leave Message</h2>
               <p className="text-gray-400 text-sm">Coming soon...</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}