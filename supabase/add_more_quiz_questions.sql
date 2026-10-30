-- DevLingo: เพิ่มคำถามเสริม 2 ข้อต่อบทเรียน (บทที่ 1-35)
-- ไม่ลบหรือแก้คำถามเดิม; ข้ามคำถามที่มี prompt และ english ซ้ำในบทเดียวกัน
-- answer_key ใช้ correct_option_position แบบเริ่มจาก 0 ตาม seed เดิม
-- สามารถรันซ้ำได้

begin;
do $add_questions$
declare
  v_course_id uuid;
  lesson_row record;
  q jsonb;
  v_lesson_id uuid;
  v_exercise_id uuid;
  v_question_id uuid;
  v_option text;
  v_option_pos integer;
  v_question_pos integer;
begin
  select id into v_course_id
  from public.courses
  where title = 'Everyday English Path'
  order by created_at limit 1;
  if v_course_id is null then
    raise exception 'Course Everyday English Path not found.';
  end if;

  for lesson_row in
    select * from (values
      (1, $q$[{"prompt":"เลือกคำทักทายช่วงเช้า","english":"Good morning!","options":["Good morning!","Good night!","Goodbye!","See you yesterday."],"answer":0,"explain":"Good morning ใช้ทักทายในตอนเช้า"},{"prompt":"เติมบทสนทนา","english":"A: Nice to meet you. B: _____","options":["Nice to meet you, too.","I am twelve.","Good night yesterday.","Where is it?"],"answer":0,"explain":"ใช้ Nice to meet you, too ตอบกลับ"}]$q$::jsonb),
      (2, $q$[{"prompt":"ถามถิ่นที่มา","english":"A: Where are you from? B: _____","options":["I'm from Thailand.","I'm fifteen years old.","I'm a student yesterday.","My name are Tom."],"answer":0,"explain":"ใช้ I'm from + ประเทศ/เมือง"},{"prompt":"เติมคำบอกอาชีพ","english":"My mother is a _____. She teaches students.","options":["teacher","driver","chef","farmer"],"answer":0,"explain":"teacher หมายถึงครู"}]$q$::jsonb),
      (3, $q$[{"prompt":"ขอให้พูดซ้ำ","english":"Could you _____ that, please?","options":["repeat","repeats","repeating","repeated"],"answer":0,"explain":"Could you ตามด้วยกริยารูปปกติ"},{"prompt":"เติมคำตอบ","english":"A: Thank you. B: _____","options":["You're welcome.","I'm fifteen.","Good morning yesterday.","No, I don't help."],"answer":0,"explain":"You're welcome ใช้ตอบคำขอบคุณ"}]$q$::jsonb),
      (4, $q$[{"prompt":"เติมกริยา","english":"She _____ up at 6 a.m. every day.","options":["wakes","wake","waking","woke"],"answer":0,"explain":"ประธาน She ใน present simple เติม -s"},{"prompt":"คำว่า never หมายถึงอะไร","english":"I never drink coffee.","options":["ไม่เคย","เสมอ","บ่อยครั้ง","บางครั้ง"],"answer":0,"explain":"never หมายถึงไม่เคย"}]$q$::jsonb),
      (5, $q$[{"prompt":"ถามราคา","english":"_____ is this sandwich?","options":["How much","How many","How often","How long"],"answer":0,"explain":"How much ใช้ถามราคา"},{"prompt":"สั่งเครื่องดื่ม","english":"I'd like _____ orange juice, please.","options":["a glass of","many","a few","any of"],"answer":0,"explain":"a glass of ใช้ระบุเครื่องดื่มหนึ่งแก้ว"}]$q$::jsonb),
      (6, $q$[{"prompt":"บอกให้เดินตรงไป","english":"Go _____ for two blocks.","options":["straight","left","behind","across from"],"answer":0,"explain":"go straight หมายถึงเดินตรงไป"},{"prompt":"ถามระยะทาง","english":"How _____ is the museum from here?","options":["far","many","much","often"],"answer":0,"explain":"How far ใช้ถามระยะทาง"}]$q$::jsonb),
      (7, $q$[{"prompt":"past tense ของ buy คืออะไร","english":"buy → _____","options":["bought","buyed","buys","buying"],"answer":0,"explain":"buy เป็น irregular verb รูปอดีตคือ bought"},{"prompt":"ปฏิเสธใน past simple","english":"He _____ go to school yesterday.","options":["didn't","doesn't","isn't","hasn't"],"answer":0,"explain":"didn't ใช้ปฏิเสธ past simple และตามด้วยกริยารูปปกติ"}]$q$::jsonb),
      (8, $q$[{"prompt":"บอกแผนในอนาคต","english":"I _____ visit my aunt this weekend.","options":["am going to","was","have","did"],"answer":0,"explain":"am going to ใช้พูดถึงแผน"},{"prompt":"คาดการณ์จากหลักฐาน","english":"Look at those clouds! It _____ rain.","options":["is going to","was","has","did"],"answer":0,"explain":"ใช้ is going to เมื่อมีหลักฐานให้คาดการณ์"}]$q$::jsonb),
      (9, $q$[{"prompt":"forecast หมายถึงอะไร","english":"weather forecast","options":["พยากรณ์อากาศ","เครื่องวัดอุณหภูมิ","ฤดูร้อน","พายุหิมะ"],"answer":0,"explain":"forecast หมายถึงการพยากรณ์"},{"prompt":"บรรยายอากาศ","english":"It is _____ today. The sun is shining.","options":["sunny","cloud","rain","wind"],"answer":0,"explain":"sunny เป็นคำคุณศัพท์บอกอากาศแดดออก"}]$q$::jsonb),
      (10, $q$[{"prompt":"ถามหาตัวเลือกที่ถูกกว่า","english":"Is there a _____ option?","options":["cheaper","cheapestly","cheaply","more cheap"],"answer":0,"explain":"cheaper เป็น comparative ของ cheap"},{"prompt":"การจ่ายเงิน","english":"Can I pay _____ credit card?","options":["by","at","on","from"],"answer":0,"explain":"pay by credit card หมายถึงจ่ายด้วยบัตรเครดิต"}]$q$::jsonb),
      (11, $q$[{"prompt":"ถามชานชาลา","english":"Which _____ does the train leave from?","options":["platform","ticket","traffic","vehicle"],"answer":0,"explain":"platform หมายถึงชานชาลา"},{"prompt":"การเดินทางด้วยรถไฟ","english":"I usually go to work _____ train.","options":["by","in","on a","at"],"answer":0,"explain":"ใช้ by + พาหนะ"}]$q$::jsonb),
      (12, $q$[{"prompt":"แจ้งว่าจองห้องพักแล้ว","english":"I have a _____ under the name Smith.","options":["reservation","receipt","direction","luggage"],"answer":0,"explain":"reservation หมายถึงการจอง"},{"prompt":"แจ้งปัญหาในห้อง","english":"The air conditioner isn't _____.","options":["working","work","worked","works"],"answer":0,"explain":"isn't working ใช้บอกอุปกรณ์กำลังไม่ทำงาน"}]$q$::jsonb),
      (13, $q$[{"prompt":"อาการปวดศีรษะ","english":"I have a _____.","options":["headache","toothbrush","stomach","feverish"],"answer":0,"explain":"have a headache หมายถึงปวดศีรษะ"},{"prompt":"ให้คำแนะนำ","english":"You should get some _____.","options":["rest","noise","traffic","exercise books"],"answer":0,"explain":"get some rest หมายถึงพักผ่อน"}]$q$::jsonb),
      (14, $q$[{"prompt":"อุปกรณ์เขียนกระดาน","english":"The teacher writes on the board with a _____.","options":["marker","ruler","calculator","notebook"],"answer":0,"explain":"marker ใช้เขียนบนกระดาน"},{"prompt":"ขออนุญาต","english":"_____ I borrow your pen?","options":["May","Must to","Am","Have"],"answer":0,"explain":"May I...? ใช้ขออนุญาตอย่างสุภาพ"}]$q$::jsonb),
      (15, $q$[{"prompt":"นัดประชุม","english":"Could we _____ a meeting for Monday?","options":["schedule","schedules","scheduled","scheduling"],"answer":0,"explain":"Could we ตามด้วยกริยารูปปกติ"},{"prompt":"ขอคำชี้แจง","english":"Could you clarify _____ point?","options":["that","those","many","much"],"answer":0,"explain":"that point หมายถึงประเด็นนั้น"}]$q$::jsonb),
      (16, $q$[{"prompt":"งานอดิเรก","english":"I enjoy _____ photographs.","options":["taking","take","takes","took"],"answer":0,"explain":"enjoy ตามด้วย gerund (verb-ing)"},{"prompt":"บอกความสนใจ","english":"She is interested _____ painting.","options":["in","on","at","for"],"answer":0,"explain":"ใช้วลี be interested in"}]$q$::jsonb),
      (17, $q$[{"prompt":"device หมายถึงอะไร","english":"electronic device","options":["อุปกรณ์","เว็บไซต์","รหัสผ่าน","เครือข่ายสังคม"],"answer":0,"explain":"device หมายถึงอุปกรณ์"},{"prompt":"การเชื่อมต่อ Wi-Fi","english":"I can't connect _____ the Wi-Fi.","options":["to","at","for","by"],"answer":0,"explain":"ใช้ connect to กับเครือข่าย"}]$q$::jsonb),
      (18, $q$[{"prompt":"เปรียบเทียบ","english":"This laptop is _____ than my old one.","options":["lighter","lightest","more lightest","lightly"],"answer":0,"explain":"lighter เป็น comparative ของ light"},{"prompt":"แสดงความชอบ","english":"I _____ tea to coffee.","options":["prefer","prefers","preferring","preferred to"],"answer":0,"explain":"prefer A to B ใช้เปรียบเทียบความชอบ"}]$q$::jsonb),
      (19, $q$[{"prompt":"คำนามนับไม่ได้","english":"Which word is uncountable?","options":["advice","chair","apple","student"],"answer":0,"explain":"advice เป็นคำนามนับไม่ได้"},{"prompt":"เติมคำบอกปริมาณ","english":"There isn't _____ milk left.","options":["much","many","a few","several"],"answer":0,"explain":"much ใช้กับคำนามนับไม่ได้"}]$q$::jsonb),
      (20, $q$[{"prompt":"Present continuous","english":"Look! The children _____ in the garden.","options":["are playing","play","plays","have play"],"answer":0,"explain":"เหตุการณ์กำลังเกิด ใช้ are + verb-ing"},{"prompt":"รูปปฏิเสธ","english":"She isn't _____ television now.","options":["watching","watch","watches","watched"],"answer":0,"explain":"หลัง isn't ใช้ verb-ing"}]$q$::jsonb),
      (21, $q$[{"prompt":"Present perfect","english":"They have _____ to Japan twice.","options":["been","be","being","went"],"answer":0,"explain":"have been ใช้พูดถึงประสบการณ์"},{"prompt":"ถามประสบการณ์","english":"Have you _____ tried sushi?","options":["ever","yesterday","last","ago"],"answer":0,"explain":"ever ใช้ถามประสบการณ์"}]$q$::jsonb),
      (22, $q$[{"prompt":"ให้คำแนะนำ","english":"You _____ see a doctor if the pain continues.","options":["should","should to","are should","shoulds"],"answer":0,"explain":"should ตามด้วยกริยารูปปกติ"},{"prompt":"ข้อบังคับ","english":"Employees _____ wear their ID badges.","options":["must","might to","can to","woulds"],"answer":0,"explain":"must ใช้แสดงข้อบังคับ"}]$q$::jsonb),
      (23, $q$[{"prompt":"First conditional","english":"If it rains, we _____ at home.","options":["will stay","stayed","would stayed","staying"],"answer":0,"explain":"If + present simple, will + base verb"},{"prompt":"If clause","english":"If she _____ early, she will catch the bus.","options":["leaves","will leave","left","leaving"],"answer":0,"explain":"if clause ใช้ present simple"}]$q$::jsonb),
      (24, $q$[{"prompt":"Reported speech","english":"He said, “I am tired.”","options":["He said that he was tired.","He said that I am tired.","He says he tired.","He told that he is tired."],"answer":0,"explain":"am เปลี่ยนเป็น was เมื่อรายงานคำพูดในอดีต"},{"prompt":"กริยารายงาน","english":"She _____ that she needed help.","options":["said","says to","tell","telling"],"answer":0,"explain":"said ใช้รายงานคำพูด"}]$q$::jsonb),
      (25, $q$[{"prompt":"Passive voice","english":"The window _____ broken yesterday.","options":["was","is","has","were being"],"answer":0,"explain":"เอกพจน์ในอดีตใช้ was + past participle"},{"prompt":"Present passive","english":"English _____ in many countries.","options":["is spoken","speaks","speaking","has speak"],"answer":0,"explain":"is spoken เป็น present simple passive"}]$q$::jsonb),
      (26, $q$[{"prompt":"คำถามสัมภาษณ์","english":"Could you tell me about yourself?","options":["ช่วยเล่าเกี่ยวกับตัวคุณได้ไหม","คุณอายุเท่าไรเมื่อวาน","คุณซื้ออะไร","คุณจะกลับบ้านเมื่อไร"],"answer":0,"explain":"เป็นคำถามทั่วไปในการสัมภาษณ์"},{"prompt":"เรซูเม่","english":"I have three years of work _____.","options":["experience","experienced","experiencing","experiences to"],"answer":0,"explain":"work experience หมายถึงประสบการณ์ทำงาน"}]$q$::jsonb),
      (27, $q$[{"prompt":"renewable energy หมายถึงอะไร","english":"renewable energy","options":["พลังงานหมุนเวียน","พลังงานที่หมดแล้ว","ขยะพลาสติก","มลพิษทางเสียง"],"answer":0,"explain":"renewable หมายถึงสามารถทดแทนหรือเกิดใหม่ได้"},{"prompt":"สิ่งแวดล้อม","english":"We should _____ plastic waste.","options":["reduce","increase","waste","pollute"],"answer":0,"explain":"reduce หมายถึงลดปริมาณ"}]$q$::jsonb),
      (28, $q$[{"prompt":"headline คืออะไร","english":"news headline","options":["พาดหัวข่าว","ความคิดเห็นส่วนตัว","รหัสผ่าน","โฆษณาสินค้า"],"answer":0,"explain":"headline คือพาดหัวข่าว"},{"prompt":"ตรวจสอบข่าวก่อนแชร์","english":"What should you do before sharing a news story?","options":["Check the source.","Share it immediately.","Trust every headline.","Ignore the date."],"answer":0,"explain":"ควรตรวจสอบแหล่งที่มาก่อนแชร์"}]$q$::jsonb),
      (29, $q$[{"prompt":"ไม่เห็นด้วยอย่างสุภาพ","english":"I respect your opinion, but _____.","options":["I see it differently.","you are stupid.","stop talking now.","that's nonsense."],"answer":0,"explain":"I see it differently แสดงความเห็นต่างอย่างสุภาพ"},{"prompt":"คำศัพท์วัฒนธรรม","english":"local customs","options":["ธรรมเนียมท้องถิ่น","สินค้าในท้องถิ่น","ลูกค้า","การแต่งกาย"],"answer":0,"explain":"customs หมายถึงธรรมเนียมหรือประเพณี"}]$q$::jsonb),
      (30, $q$[{"prompt":"ขั้นตอนแก้ปัญหา","english":"Before fixing a problem, you should _____.","options":["identify the cause","ignore the symptoms","delete everything","blame someone"],"answer":0,"explain":"ควรระบุสาเหตุก่อนเลือกวิธีแก้"},{"prompt":"อธิบายผลการแก้ปัญหา","english":"The issue was _____ after the update.","options":["resolved","resolving","resolve","resolution"],"answer":0,"explain":"was resolved หมายถึงได้รับการแก้ไขแล้ว"}]$q$::jsonb),
      (31, $q$[{"prompt":"phrasal verb call off","english":"They called off the match.","options":["ยกเลิกการแข่งขัน","เริ่มการแข่งขัน","โทรหากรรมการ","เลื่อนเวลา"],"answer":0,"explain":"call off หมายถึงยกเลิก"},{"prompt":"phrasal verb","english":"Please turn _____ the lights before leaving.","options":["off","up to","into","over at"],"answer":0,"explain":"turn off หมายถึงปิด"}]$q$::jsonb),
      (32, $q$[{"prompt":"ไฟล์แนบอีเมล","english":"Please find the report _____.","options":["attached","attach","attaching it","attachmently"],"answer":0,"explain":"attached ใช้บอกไฟล์ที่แนบมา"},{"prompt":"คำขอเป็นทางการ","english":"I am writing to _____ about the application.","options":["inquire","inquiry","inquiringly","inquired"],"answer":0,"explain":"to ตามด้วยกริยารูปปกติ"}]$q$::jsonb),
      (33, $q$[{"prompt":"เสนอเวลานัด","english":"How about meeting on Thursday instead?","options":["ลองนัดพบวันพฤหัสบดีแทนไหม","คุณพบใครวันพฤหัสบดี","วันพฤหัสบดีราคาเท่าไร","ฉันไม่เคยพบคุณ"],"answer":0,"explain":"How about + verb-ing ใช้เสนอความคิด"},{"prompt":"ต่อรองราคา","english":"Could you offer a _____ price?","options":["lower","lowly","lowest than","more low"],"answer":0,"explain":"lower เป็น comparative ของ low"}]$q$::jsonb),
      (34, $q$[{"prompt":"เชื่อมความขัดแย้ง","english":"The solution is costly. _____, it is effective.","options":["However","Because","For example","Therefore that"],"answer":0,"explain":"However ใช้เชื่อมข้อความที่ขัดแย้ง"},{"prompt":"สรุปข้อโต้แย้ง","english":"Which sentence gives a conclusion?","options":["Therefore, we should take action.","Where did you go?","I bought it yesterday.","Please open the window."],"answer":0,"explain":"Therefore ใช้เชื่อมไปสู่ข้อสรุป"}]$q$::jsonb),
      (35, $q$[{"prompt":"คำศัพท์การเดินทาง","english":"An itinerary is _____.","options":["a travel plan","a passport photo","a hotel employee","a type of food"],"answer":0,"explain":"itinerary หมายถึงกำหนดการเดินทาง"},{"prompt":"Present perfect","english":"We have _____ several countries.","options":["visited","visit","visiting","visits"],"answer":0,"explain":"have ตามด้วย past participle คือ visited"}]$q$::jsonb)
    ) as data(position, questions)
  loop
    select id into v_lesson_id
    from public.lessons
    where course_id = v_course_id and position = lesson_row.position
    order by created_at limit 1;
    if v_lesson_id is null then
      raise exception 'Lesson position % not found.', lesson_row.position;
    end if;

    select id into v_exercise_id
    from public.exercises
    where lesson_id = v_lesson_id and title = 'Practice quiz'
    order by position limit 1;
    if v_exercise_id is null then
      insert into public.exercises (lesson_id,title,position)
      values (v_lesson_id,'Practice quiz',1)
      returning id into v_exercise_id;
    end if;

    select coalesce(max(position),0) into v_question_pos
    from public.questions where exercise_id = v_exercise_id;

    for q in select value from jsonb_array_elements(lesson_row.questions)
    loop
      if not exists (
        select 1 from public.questions
        where exercise_id = v_exercise_id
          and prompt = q->>'prompt'
          and coalesce(english,'') = coalesce(q->>'english','')
      ) then
        v_question_pos := v_question_pos + 1;
        insert into public.questions
          (exercise_id,prompt,english,question_type,explanation,position)
        values
          (v_exercise_id,q->>'prompt',q->>'english','multiple_choice',
           q->>'explain',v_question_pos)
        returning id into v_question_id;

        v_option_pos := 0;
        for v_option in
          select value
          from jsonb_array_elements_text(q->'options') with ordinality as opts(value,ord)
          order by ord
        loop
          insert into public.question_options (question_id,option_text,position)
          values (v_question_id,v_option,v_option_pos);
          v_option_pos := v_option_pos + 1;
        end loop;

        insert into public.question_answer_keys (question_id,answer_key)
        values (v_question_id,
          jsonb_build_object('correct_option_position',(q->>'answer')::integer));
      end if;
    end loop;
    v_lesson_id := null;
    v_exercise_id := null;
  end loop;
end
$add_questions$;
commit;

-- ตรวจสอบจำนวนคำถามหลังรัน
select l.position as lesson_number, l.title as lesson_title,
       count(q.id) as question_count
from public.lessons l
join public.courses c on c.id = l.course_id
left join public.exercises e on e.lesson_id = l.id and e.title = 'Practice quiz'
left join public.questions q on q.exercise_id = e.id
where c.title = 'Everyday English Path'
group by l.id,l.position,l.title
order by l.position;
