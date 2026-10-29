-- DevLingo: สร้างแบบทดสอบให้ 8 บทแรกใน Supabase
-- ใช้ lesson_key เดิมเพื่อให้ความก้าวหน้าที่บันทึกไว้ไม่หาย
-- รันซ้ำได้: ไม่สร้างคำถาม/ตัวเลือกซ้ำ และอัปเดตเฉลยให้ตรงกับข้อมูลต้นฉบับ
alter table public.questions add column if not exists english text;

begin;

do $seed$
declare
  v_course_id uuid;
  v_lesson_id uuid;
  v_exercise_id uuid;
  v_question_id uuid;
  lesson_row record;
  q jsonb;
  opt text;
  option_pos integer;
  question_pos integer;
  correct_pos integer;
begin
  select id into v_course_id
  from public.courses
  where title = 'Everyday English Path'
  order by created_at
  limit 1;

  if v_course_id is null then
    raise exception 'Course Everyday English Path is missing. Run seed_lessons.sql first.';
  end if;

  for lesson_row in
    select * from (values
      ('greetings', $json$[
        {"prompt":"เลือกคำแปลที่ถูกต้อง","english":"Hello!","options":["ลาก่อน","สวัสดี","ขอบคุณ","ขอโทษ"],"answer":1,"explain":"Hello ใช้ทักทาย แปลว่า สวัสดี"},
        {"prompt":"เติมคำให้สมบูรณ์","english":"Nice to _____ you.","options":["eat","meet","sleep","run"],"answer":1,"explain":"Nice to meet you = ยินดีที่ได้รู้จัก"},
        {"prompt":"เลือกประโยคแนะนำตัว","english":"ฉันชื่อแอนนา","options":["I am fine.","My name is Anna.","Where are you?","Good night."],"answer":1,"explain":"My name is... ใช้บอกชื่อ"},
        {"prompt":"ถ้ามีคนพูดว่า Hello! ควรตอบอย่างไร","english":"Hello!","options":["Hello!","I'm sorry.","Good night.","I'm hungry."],"answer":0,"explain":"ตอบคำทักทายกลับด้วย Hello! ได้"},
        {"prompt":"คำว่า Goodbye หมายถึงอะไร","english":"Goodbye","options":["สวัสดี","ขอบคุณ","ลาก่อน","ยินดีที่ได้รู้จัก"],"answer":2,"explain":"Goodbye ใช้กล่าวลา"}
      ]$json$::jsonb),
      ('introductions', $json$[
        {"prompt":"เลือกคำถามถามชื่อ","english":"_____ is your name?","options":["Who","What","Where","When"],"answer":1,"explain":"What is your name? = คุณชื่ออะไร"},
        {"prompt":"เติมคำตอบให้ถูกต้อง","english":"Where are you _____?","options":["from","name","fine","old"],"answer":0,"explain":"Where are you from? ถามว่ามาจากที่ไหน"},
        {"prompt":"แปลประโยคนี้","english":"I am eighteen years old.","options":["ฉันมีพี่น้อง 18 คน","ฉันอายุ 18 ปี","ฉันชื่อเอททีน","ฉันอยู่บ้านเลขที่ 18"],"answer":1,"explain":"years old ใช้บอกอายุ"},
        {"prompt":"เลือกคำตอบของ How are you?","english":"How are you?","options":["I'm fine, thanks.","My name is Tom.","I'm from Thailand.","See you yesterday."],"answer":0,"explain":"I'm fine, thanks. เป็นคำตอบทั่วไปของ How are you?"},
        {"prompt":"เลือกประโยคบอกประเทศ","english":"ฉันมาจากประเทศไทย","options":["I am Thailand.","I from Thai.","I am from Thailand.","I have Thailand."],"answer":2,"explain":"I am from Thailand = ฉันมาจากประเทศไทย"}
      ]$json$::jsonb),
      ('everyday', $json$[
        {"prompt":"เลือกคำที่ใช้ขอบคุณ","english":"Thank you.","options":["ขอโทษ","ขอบคุณ","ไม่เป็นไร","ลาก่อน"],"answer":1,"explain":"Thank you = ขอบคุณ"},
        {"prompt":"ถ้าต้องการขอโทษควรพูดว่าอะไร","english":"ขอโทษ","options":["Excuse me / I'm sorry","Good luck","You're welcome","See you"],"answer":0,"explain":"I'm sorry ใช้ขอโทษ ส่วน Excuse me ใช้ขอทางหรือเรียกความสนใจ"},
        {"prompt":"เติมคำตอบ","english":"Thank you! — You're _____.","options":["fine","welcome","sorry","name"],"answer":1,"explain":"You're welcome = ด้วยความยินดี"},
        {"prompt":"คำว่า Please ใช้เพื่ออะไร","english":"Please","options":["ทำให้คำขอสุภาพ","บอกลา","ถามอายุ","บอกเวลา"],"answer":0,"explain":"Please ทำให้คำขอสุภาพขึ้น"},
        {"prompt":"เลือกวลีที่เหมาะกับการบอกลา","english":"แล้วพบกันใหม่","options":["See you later.","How old are you?","I'm from here.","Nice to eat you."],"answer":0,"explain":"See you later = แล้วพบกันใหม่"}
      ]$json$::jsonb),
      ('daily-routine', $json$[
        {"prompt":"เลือกคำแปลของ wake up","english":"I wake up at six.","options":["ฉันเข้านอนหกโมง","ฉันตื่นนอนตอนหกโมง","ฉันกินข้าวหกโมง","ฉันไปโรงเรียนหกโมง"],"answer":1,"explain":"wake up = ตื่นนอน"},
        {"prompt":"เติมคำกริยา","english":"I _____ breakfast every morning.","options":["have","has","having","hadn't"],"answer":0,"explain":"I ใช้ have ใน present simple"},
        {"prompt":"เลือกคำที่หมายถึงทำงาน","english":"work","options":["เล่น","นอน","ทำงาน","อ่าน"],"answer":2,"explain":"work = ทำงาน"},
        {"prompt":"เลือกประโยคที่ถูกต้อง","english":"เขาไปโรงเรียนทุกวัน","options":["He go to school every day.","He goes to school every day.","He going school every day.","He gone to school every day."],"answer":1,"explain":"ประธาน He ใน present simple เติม -s/-es ที่กริยา"},
        {"prompt":"คำว่า usually หมายถึงอะไร","english":"I usually walk to school.","options":["ไม่เคย","เมื่อวาน","โดยปกติ","พรุ่งนี้"],"answer":2,"explain":"usually = โดยปกติ"}
      ]$json$::jsonb),
      ('food-ordering', $json$[
        {"prompt":"สั่งน้ำหนึ่งแก้วอย่างสุภาพ","english":"ขอน้ำหนึ่งแก้วครับ/ค่ะ","options":["I water one.","Can I have a glass of water, please?","Where water is?","I am water."],"answer":1,"explain":"Can I have...? เป็นรูปแบบการขออย่างสุภาพ"},
        {"prompt":"What does 'menu' mean?","english":"menu","options":["ใบเสร็จ","เมนูอาหาร","ห้องครัว","พนักงาน"],"answer":1,"explain":"menu = รายการอาหาร"},
        {"prompt":"เติมคำ","english":"I'd like _____ chicken, please.","options":["some","many of","a few of","any of"],"answer":0,"explain":"some ใช้กับคำนามนับไม่ได้หรือปริมาณไม่ระบุชัด"},
        {"prompt":"ต้องการขอเช็กบิลควรพูดว่าอะไร","english":"เช็กบิลด้วยครับ/ค่ะ","options":["The bill, please.","I'm the bill.","Where is menu?","Pay me food."],"answer":0,"explain":"The bill, please เป็นคำขอเช็กบิล"},
        {"prompt":"คำว่า delicious หมายถึงอะไร","english":"This soup is delicious.","options":["เผ็ดมาก","เย็นมาก","อร่อย","แพง"],"answer":2,"explain":"delicious = อร่อย"}
      ]$json$::jsonb),
      ('directions', $json$[
        {"prompt":"ถามว่าห้องน้ำอยู่ที่ไหน","english":"Where is the restroom?","options":["ห้องน้ำราคาเท่าไร","ห้องน้ำอยู่ที่ไหน","ห้องน้ำเปิดกี่โมง","นี่คือห้องน้ำไหม"],"answer":1,"explain":"Where is...? ใช้ถามตำแหน่ง"},
        {"prompt":"คำว่า turn left หมายถึงอะไร","english":"Turn left at the corner.","options":["เลี้ยวขวา","เดินตรงไป","เลี้ยวซ้าย","กลับหลัง"],"answer":2,"explain":"turn left = เลี้ยวซ้าย"},
        {"prompt":"เติมคำ","english":"Go _____ ahead.","options":["straight","leftly","near","behind of"],"answer":0,"explain":"go straight ahead = เดินตรงไป"},
        {"prompt":"คำว่า opposite หมายถึงอะไร","english":"The bank is opposite the school.","options":["ข้างใน","ตรงข้าม","ข้างหลัง","ระหว่าง"],"answer":1,"explain":"opposite = ตรงข้าม"},
        {"prompt":"เลือกคำถามขอความช่วยเหลือ","english":"ขอโทษครับ ช่วยบอกทางได้ไหม","options":["Excuse me, can you help me?","You are a road.","I need direction yesterday.","Where you go?"],"answer":0,"explain":"Excuse me, can you help me? เป็นการเริ่มขอความช่วยเหลืออย่างสุภาพ"}
      ]$json$::jsonb),
      ('past-tense', $json$[
        {"prompt":"เลือก past tense ของ go","english":"go → ?","options":["goed","gone","went","goes"],"answer":2,"explain":"go เป็น irregular verb รูปอดีตคือ went"},
        {"prompt":"เติมคำ","english":"I _____ a movie last night.","options":["watch","watched","watches","watching"],"answer":1,"explain":"last night บอกอดีต จึงใช้ watched"},
        {"prompt":"เลือกประโยคที่ถูกต้อง","english":"เธอไม่ได้ไปโรงเรียนเมื่อวาน","options":["She didn't went to school.","She doesn't went to school.","She didn't go to school.","She not go school yesterday."],"answer":2,"explain":"didn't ตามด้วยกริยารูปพื้นฐาน"},
        {"prompt":"คำถามอดีตที่ถูกต้อง","english":"_____ you see him yesterday?","options":["Do","Did","Are","Have"],"answer":1,"explain":"Did ใช้สร้างคำถาม past simple"},
        {"prompt":"คำว่า bought เป็นอดีตของคำใด","english":"bought","options":["bring","buy","build","begin"],"answer":1,"explain":"buy → bought"}
      ]$json$::jsonb),
      ('future-plans', $json$[
        {"prompt":"เลือกประโยคพูดถึงอนาคต","english":"พรุ่งนี้ฉันจะอ่านหนังสือ","options":["I read yesterday.","I will study tomorrow.","I studied tomorrow.","I studying now."],"answer":1,"explain":"will + verb ใช้พูดถึงอนาคต"},
        {"prompt":"เติมคำ","english":"She is going _____ visit her aunt.","options":["at","to","for","on"],"answer":1,"explain":"be going to + verb ใช้พูดถึงแผน"},
        {"prompt":"เลือกคำแปลของ probably","english":"It will probably rain.","options":["แน่นอนว่า","อาจจะ/น่าจะ","เมื่อวาน","ไม่เคย"],"answer":1,"explain":"probably = น่าจะ"},
        {"prompt":"เลือกคำถามเกี่ยวกับแผน","english":"สุดสัปดาห์นี้คุณจะทำอะไร","options":["What did you do last week?","What are you going to do this weekend?","Where were you born?","What do you ate?"],"answer":1,"explain":"What are you going to do...? ใช้ถามแผน"},
        {"prompt":"เติมคำ","english":"I think they _____ arrive soon.","options":["will","was","did","are be"],"answer":0,"explain":"will + verb ใช้คาดการณ์อนาคต"}
      ]$json$::jsonb)
    ) as seed_data(lesson_key, questions)
  loop
    select id into v_lesson_id
    from public.lessons
    where course_id = v_course_id
      and content->>'lesson_key' = lesson_row.lesson_key
    limit 1;

    if v_lesson_id is null then
      raise exception 'Lesson key % not found. Run seed_lessons.sql first.', lesson_row.lesson_key;
    end if;

    select id into v_exercise_id
    from public.exercises
    where lesson_id = v_lesson_id and title = 'Practice quiz'
    limit 1;

    if v_exercise_id is null then
      insert into public.exercises (lesson_id, title, position)
      values (v_lesson_id, 'Practice quiz', 1)
      returning id into v_exercise_id;
    end if;

    question_pos := 0;
    for q in select value from jsonb_array_elements(lesson_row.questions)
    loop
      question_pos := question_pos + 1;

      select id into v_question_id
      from public.questions
      where exercise_id = v_exercise_id and prompt = q->>'prompt'
      limit 1;

      if v_question_id is null then
        insert into public.questions (exercise_id, prompt, english, question_type, explanation, position)
        values (v_exercise_id, q->>'prompt', q->>'english', 'multiple_choice', q->>'explain', question_pos)
        returning id into v_question_id;
      else
        update public.questions
        set english = q->>'english',
            explanation = q->>'explain',
            position = question_pos
        where id = v_question_id;
      end if;

      if not exists (select 1 from public.question_options where question_id = v_question_id) then
        option_pos := 0;
        for opt in
          select value
          from jsonb_array_elements_text(q->'options') with ordinality as x(value, ord)
          order by ord
        loop
          option_pos := option_pos + 1;
          insert into public.question_options (question_id, option_text, position)
          values (v_question_id, opt, option_pos);
        end loop;
      end if;

      correct_pos := (q->>'answer')::integer + 1;
      insert into public.question_answer_keys (question_id, answer_key)
      values (v_question_id, jsonb_build_object('correct_option_position', correct_pos))
      on conflict (question_id)
      do update set answer_key = excluded.answer_key;
    end loop;

    v_lesson_id := null;
    v_exercise_id := null;
    v_question_id := null;
  end loop;

  update public.courses
  set lesson_count = (
    select count(*) from public.lessons
    where course_id = v_course_id and published = true
  )
  where id = v_course_id;
end
$seed$;

commit;
