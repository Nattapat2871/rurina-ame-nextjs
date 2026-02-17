import type { Metadata } from "next";
import { Kanit } from "next/font/google"; // 1. เปลี่ยนจาก Inter เป็น Kanit
import "./globals.css";

// 2. ตั้งค่า Kanit Font ให้รองรับภาษาไทย
const kanit = Kanit({
  subsets: ["latin", "thai"], // ⚠️ สำคัญมาก: ต้องใส่ 'thai' ไม่งั้นสระลอย/วรรณยุกต์เพี้ยน
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-kanit", // ตั้งชื่อตัวแปร CSS เพื่อส่งไปให้ Tailwind
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rurina-Ame Dashboard",
  description: "Control panel for Discord Bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      {/* 3. เรียกใช้ตัวแปร font และ className ที่ Body */}
      <body className={`${kanit.variable} ${kanit.className} antialiased`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}