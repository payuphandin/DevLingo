-- DevLingo: เพิ่มเส้นทาง 8 บทเรียน (safe to run more than once)
-- ใช้กับ schema.sql ที่มี courses, lessons, exercises, questions, question_options, question_answer_keys
-- เนื้อหาหลักในหน้าเว็บอยู่ใน lib/lesson-data.ts; SQL นี้เตรียม course/lesson records สำหรับต่อยอดดึงเนื้อหาจากฐานข้อมูล
begin;

insert into public.courses (title, description, level, category, lesson_count, estimated_minutes, published)
select 'Everyday English Path', 'เส้นทางภาษาอังกฤษจากพื้นฐานไปสู่การสื่อสารในชีวิตประจำวัน', 'Beginner–Pre-intermediate', 'General English', 8, 64, true
where not exists (select 1 from public.courses where title = 'Everyday English Path');

with course_row as (
 select id from public.courses where title = 'Everyday English Path' order by created_at limit 1
), seed(position, title, description, estimated_minutes, content) as (
 values
 (1,'Hello! Nice to meet you','คำทักทายและแนะนำตัว',5,'{"lesson_key":"greetings","level":"Beginner 1","xp":30,"required_xp":0}'::jsonb),
 (2,'Tell me about yourself','ข้อมูลส่วนตัวและการแนะนำตัว',6,'{"lesson_key":"introductions","level":"Beginner 1","xp":35,"required_xp":30}'::jsonb),
 (3,'Everyday expressions','วลีที่ใช้ในชีวิตประจำวัน',7,'{"lesson_key":"everyday","level":"Beginner 2","xp":40,"required_xp":65}'::jsonb),
 (4,'My daily routine','กิจวัตรประจำวันและคำกริยาพื้นฐาน',8,'{"lesson_key":"daily-routine","level":"Beginner 2","xp":45,"required_xp":105}'::jsonb),
 (5,'Food and ordering','อาหารและการสั่งอาหาร',9,'{"lesson_key":"food-ordering","level":"Beginner 3","xp":50,"required_xp":150}'::jsonb),
 (6,'Asking for directions','ถามทางและบอกตำแหน่ง',9,'{"lesson_key":"directions","level":"Beginner 3","xp":55,"required_xp":200}'::jsonb),
 (7,'What did you do yesterday?','เล่าเหตุการณ์ในอดีต',10,'{"lesson_key":"past-tense","level":"Pre-intermediate","xp":60,"required_xp":255}'::jsonb),
 (8,'Plans and predictions','พูดถึงแผนในอนาคต',10,'{"lesson_key":"future-plans","level":"Pre-intermediate","xp":65,"required_xp":315}'::jsonb)
)
insert into public.lessons (course_id,title,description,content,position,estimated_minutes,published)
select c.id,s.title,s.description,s.content,s.position,s.estimated_minutes,true
from course_row c cross join seed s
where not exists (
 select 1 from public.lessons l where l.course_id=c.id and l.content->>'lesson_key'=s.content->>'lesson_key'
);

update public.courses c set lesson_count = (
 select count(*) from public.lessons l where l.course_id=c.id and l.published=true
) where c.title='Everyday English Path';

-- ช่วยบัญชีเดิมที่เคยจบบท greetings ด้วยรางวัลเก่า 20 XP ไม่ให้ติดล็อกบท 2
update public.learner_progress
set xp = greatest(xp, case
  when completed @> array['future-plans']::text[] then 380
  when completed @> array['past-tense']::text[] then 315
  when completed @> array['directions']::text[] then 255
  when completed @> array['food-ordering']::text[] then 200
  when completed @> array['daily-routine']::text[] then 150
  when completed @> array['everyday']::text[] then 105
  when completed @> array['introductions']::text[] then 65
  when completed @> array['greetings']::text[] then 30
  else 0
end), updated_at = now()
where cardinality(completed) > 0;

commit;

-- เกณฑ์ XP:
-- บท 1: 30 XP, บท 2: 35 XP (ต้องมี 30), บท 3: 40 XP (65), บท 4: 45 XP (105)
-- บท 5: 50 XP (150), บท 6: 55 XP (200), บท 7: 60 XP (255), บท 8: 65 XP (315)
-- ผ่านบทเมื่อตอบถูกอย่างน้อย 4/5 ข้อ; XP คำนวณตามจำนวนที่ตอบถูก
