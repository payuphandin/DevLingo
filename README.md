# DevLingo

แพลตฟอร์มฝึกภาษาอังกฤษ สร้างด้วย Next.js App Router, TypeScript, Tailwind CSS และ Supabase

## เริ่มต้นใช้งาน
1. ติดตั้ง Node.js รุ่น LTS
2. ติดตั้ง dependencies: `npm install`
3. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ Supabase Project URL และ Publishable/Anon Key
4. เปิด Supabase Dashboard → Authentication → Providers → Email และตั้งค่า email confirmation ตามต้องการ
5. เปิด Supabase SQL Editor แล้วตรวจสอบและรัน `supabase/schema.sql`
6. รัน `npm run dev` และเปิด http://localhost:3000

## บทเรียนจาก Supabase
- หน้าเส้นทางการเรียนและหน้าแบบทดสอบอ่านข้อมูลจากตาราง `courses`, `lessons`, `exercises`, `questions` และ `question_options` ผ่าน Next.js API routes ไม่ใช้ `lib/lesson-data.ts` เป็นแหล่งข้อมูลบทเรียนแล้ว
- รัน `supabase/seed_initial_quizzes.sql` หนึ่งครั้งเพื่อบันทึกแบบทดสอบของ 8 บทแรกลงฐานข้อมูล
- รันไฟล์ `supabase/seed_more_lessons.sql` เวอร์ชันล่าสุดซ้ำได้ เพื่อเติมบทเรียนเพิ่มเติมและคอลัมน์ตัวอย่างภาษาอังกฤษ
- หน้าเว็บดึงบทเรียนทั้งหมดที่อยู่ในหลักสูตร `Everyday English Path` จาก Supabase โดยไม่จำกัดจำนวนและไม่กรองด้วยสถานะ `published` แล้วเรียงตาม `position`
- การตรวจเฉลยใช้ `SUPABASE_SERVICE_ROLE_KEY` ใน API ฝั่งเซิร์ฟเวอร์เท่านั้น เพื่อไม่ส่งตารางเฉลยให้เบราว์เซอร์อ่านโดยตรง

## Authentication และความก้าวหน้า
- ใช้ Supabase Auth สำหรับสมัครสมาชิกและเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน
- ตาราง `learner_progress` เก็บ XP, บทเรียนที่สำเร็จ และ streak แยกตาม `auth.users.id`
- Row Level Security จำกัดให้ผู้ใช้ดูหรือแก้ไขความก้าวหน้าของบัญชีตัวเองเท่านั้น
- เนื้อหาบทเรียนยังสามารถเปิดอ่านได้ตาม policies ที่กำหนด
- ตั้งค่า URL redirect และ email confirmation ให้ตรงกับโดเมนที่ใช้ใน Supabase ก่อน deploy

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ใช้ publishable key ได้เช่นกัน)
- `SUPABASE_SERVICE_ROLE_KEY` (ใช้เฉพาะบนเซิร์ฟเวอร์สำหรับตรวจเฉลยแบบทดสอบ; เพิ่มค่าใน `.env.local` และ Environment Variables ของ Vercel)
ห้ามใส่ Service Role Key ในตัวแปร `NEXT_PUBLIC_*` หรือส่งค่านี้ไปยังเบราว์เซอร์เด็ดขาด

## Scripts
- `npm run dev` — โหมดพัฒนา
- `npm run build` — ตรวจ Production Build
- `npm run start` — Production Server
- `npm run lint` — ตรวจ ESLint
