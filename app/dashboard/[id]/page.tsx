"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Megaphone, ArrowRight, Activity, Users, ShieldCheck, Plus } from "lucide-react";

export default function GuildDashboardHome() {
  const { id } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // State สำหรับเก็บข้อมูล
  const [statsData, setStatsData] = useState({
    member_count: 0,
    latency: 0,
    isLoaded: false
  });

  // Fetch ข้อมูล Stats
  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/guilds/${id}/stats`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                setStatsData({
                    member_count: data.member_count || 0,
                    latency: data.latency || 0,
                    isLoaded: true
                });
            }
        })
        .catch(err => console.error("Failed to fetch stats:", err));
  }, [id, API_URL]);

  const stats = [
    { 
        // 🔥 แก้ไขตรงนี้: เปลี่ยนเป็น Total Members และโชว์แค่ยอดรวม
        label: "Total Members", 
        value: statsData.isLoaded ? statsData.member_count.toLocaleString() : "Loading...", 
        icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" 
    },
    { 
        label: "Bot Ping", 
        value: statsData.isLoaded ? `${statsData.latency} ms` : "...", 
        icon: Activity, color: "text-green-400", bg: "bg-green-400/10" 
    },
    { 
        label: "Protection", 
        value: "Active", 
        icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" 
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto opacity-0 animate-fade-in-up">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
          Dashboard Overview
        </h1>
        <p className="text-secondary text-lg">ภาพรวมและเมนูจัดการทั้งหมดของเซิร์ฟเวอร์</p>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-lg shadow-black/20 hover:border-primary/30 transition-colors duration-300">
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-secondary text-sm font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-foreground text-xl font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/50 my-8 w-full" />

      {/* --- Features Grid --- */}
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-primary rounded-full"></span>
        Features (ฟีเจอร์ที่มี)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 📢 Announcement Feature Card */}
        <Link href={`/dashboard/${id}/announcements`} className="group relative bg-card hover:bg-card-hover border border-border hover:border-primary rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <Megaphone className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
              <Megaphone className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              Announcements
            </h3>
            <p className="text-secondary text-sm mb-8 leading-relaxed">
              จัดการระบบประกาศอัตโนมัติ เช่น ข้อความต้อนรับ (Join), ข้อความอำลา (Leave) และการแจ้งเตือน Boost
            </p>
            
            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
              จัดการเลย <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* 🔒 Placeholder for Future Features */}
        <div className="group relative bg-card/40 border border-border border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center min-h-[280px] hover:bg-card/60 transition-colors cursor-not-allowed">
            <div className="p-4 bg-secondary/10 rounded-full mb-4">
                <Plus className="w-8 h-8 text-secondary/50" />
            </div>
            <h3 className="text-xl font-bold text-secondary mb-1">Coming Soon</h3>
            <p className="text-secondary/50 text-sm">ฟีเจอร์ใหม่ๆ กำลังมาเร็วๆ นี้</p>
        </div>

      </div>
    </div>
  );
}