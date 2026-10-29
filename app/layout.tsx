import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devlingo — เรียนอังกฤษให้เป็นเรื่องสนุก",
  description: "ฝึกภาษาอังกฤษวันละนิด ให้เก่งขึ้นทุกวันไปกับ Devlingo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
