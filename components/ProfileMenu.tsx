"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  avatar_decoration_data?: { asset: string; sku_id: string; } | null;
}

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => { if (!data.error) setUser(data); })
      .catch((err) => console.error("โหลดโปรไฟล์ไม่สำเร็จ:", err));

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [API_URL]);

  if (!user) {
    return <div className="w-10 h-10 rounded-full bg-[#2b2d31] animate-pulse border border-[#1e1f22]"></div>;
  }

  const avatarExtension = user.avatar?.startsWith("a_") ? "gif" : "png";
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}?size=128`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  const decorationUrl = user.avatar_decoration_data
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=128&passthrough=true`
    : null;

  return (
    <div className="relative inline-block text-left z-50 font-sans" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:opacity-80 transition-all duration-200 focus:outline-none hover:scale-105 active:scale-95"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden relative border-2 border-[#1e1f22] shadow-sm">
          <img src={avatarUrl} alt="User Avatar" className="object-cover w-full h-full" />
        </div>
        {decorationUrl && (
          <div className="absolute inset-0 pointer-events-none w-12 h-12 -top-1 -left-1">
            <img src={decorationUrl} alt="Avatar Decoration" className="object-cover w-full h-full" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-60 bg-[#111214] border border-[#1e1f22] rounded-xl shadow-2xl overflow-hidden animate-scale-in origin-top-right">
          <div className="p-4 border-b border-[#1e1f22] bg-[#2b2d31]">
            <p className="text-sm font-bold text-white truncate">
              {user.global_name || user.username}
            </p>
            <p className="text-xs text-[#949ba4] truncate font-mono mt-0.5">@{user.username}</p>
          </div>
          <div className="p-2 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#dbdee1] hover:bg-[#5865f2] hover:text-white transition-all duration-200 group"
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="w-4 h-4 text-[#949ba4] group-hover:text-white transition-colors" />
              <span>Dashboard</span>
            </Link>
            
            <div className="border-t border-[#1e1f22] my-1 opacity-50"></div>

            <a
              href={`${API_URL}/api/auth/logout`}
              className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-[#fa777c] hover:bg-[#fa777c]/10 hover:text-[#ff8a8e] transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 text-[#fa777c] group-hover:scale-110 transition-transform" />
              <span>Logout</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}