"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  avatar_decoration_data?: {
    asset: string;
    sku_id: string;
  } | null;
}

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ดึงข้อมูลเมื่อโหลด Component
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setUser(data);
      })
      .catch((err) => console.error("โหลดโปรไฟล์ไม่สำเร็จ:", err));

    // ปิดเมนูเมื่อคลิกพื้นที่อื่น
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [API_URL]);

  // ระหว่างรอโหลด ให้แสดงเป็นวงกลมสีเทากระพริบเบาๆ
  if (!user) {
    return <div className="w-12 h-12 rounded-full bg-[#2b2d31] animate-pulse"></div>;
  }

  // เช็คว่าเป็น GIF หรือ PNG
  const avatarExtension = user.avatar?.startsWith("a_") ? "gif" : "png";
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const decorationUrl = user.avatar_decoration_data
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128&passthrough=true`
    : null;

  return (
    <div className="relative inline-block text-left z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-12 h-12 rounded-full hover:opacity-80 transition-opacity focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden relative">
          <img src={avatarUrl} alt="User Avatar" className="object-cover w-full h-full" />
        </div>

        {decorationUrl && (
          <div className="absolute inset-0 pointer-events-none w-12 h-12 -top-1 -left-1">
            <img src={decorationUrl} alt="Avatar Decoration" className="object-cover w-full h-full" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#2b2d31] border border-[#1e1f22] rounded-lg shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1e1f22] bg-[#232428]">
            <p className="text-sm font-bold text-white truncate">
              {user.global_name || user.username}
            </p>
            <p className="text-xs text-[#949ba4] truncate">@{user.username}</p>
          </div>
          <div className="py-1">
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm text-[#dbdee1] hover:bg-[#3f4147] hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              🏠 Dashboard
            </Link>
            
            {/* โยงไป API Logout หลังบ้านโดยตรงเพื่อล้าง Session */}
            <a
              href={`${API_URL}/api/auth/logout`}
              className="block w-full text-left px-4 py-2 text-sm text-[#fa777c] hover:bg-[#3f4147] hover:text-[#ff8a8e] transition-colors"
            >
              🚪 Logout
            </a>
          </div>
        </div>
      )}
    </div>
  );
}