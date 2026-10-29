export type Question = { prompt: string; english: string; options: string[]; answer: number; explain: string };
export type Lesson = { id: string; title: string; sub: string; level: string; mins: number; xp: number; requiredXp: number; questions: Question[] };

export const lessons: Lesson[] = [
 { id:"greetings", title:"Hello! Nice to meet you", sub:"คำทักทายและแนะนำตัว", level:"Beginner 1", mins:5, xp:30, requiredXp:0, questions:[
  {prompt:"เลือกคำแปลที่ถูกต้อง",english:"Hello!",options:["ลาก่อน","สวัสดี","ขอบคุณ","ขอโทษ"],answer:1,explain:"Hello ใช้ทักทาย แปลว่า สวัสดี"},
  {prompt:"เติมคำให้สมบูรณ์",english:"Nice to _____ you.",options:["eat","meet","sleep","run"],answer:1,explain:"Nice to meet you = ยินดีที่ได้รู้จัก"},
  {prompt:"เลือกประโยคแนะนำตัว",english:"ฉันชื่อแอนนา",options:["I am fine.","My name is Anna.","Where are you?","Good night."],answer:1,explain:"My name is... ใช้บอกชื่อ"},
  {prompt:"ถ้ามีคนพูดว่า Hello! ควรตอบอย่างไร",english:"Hello!",options:["Hello!","I'm sorry.","Good night.","I'm hungry."],answer:0,explain:"ตอบคำทักทายกลับด้วย Hello! ได้"},
  {prompt:"คำว่า Goodbye หมายถึงอะไร",english:"Goodbye",options:["สวัสดี","ขอบคุณ","ลาก่อน","ยินดีที่ได้รู้จัก"],answer:2,explain:"Goodbye ใช้กล่าวลา"}
 ]},
 { id:"introductions", title:"Tell me about yourself", sub:"ข้อมูลส่วนตัวและการแนะนำตัว", level:"Beginner 1", mins:6, xp:35, requiredXp:30, questions:[
  {prompt:"เลือกคำถามถามชื่อ",english:"_____ is your name?",options:["Who","What","Where","When"],answer:1,explain:"What is your name? = คุณชื่ออะไร"},
  {prompt:"เติมคำตอบให้ถูกต้อง",english:"Where are you _____?",options:["from","name","fine","old"],answer:0,explain:"Where are you from? ถามว่ามาจากที่ไหน"},
  {prompt:"แปลประโยคนี้",english:"I am eighteen years old.",options:["ฉันมีพี่น้อง 18 คน","ฉันอายุ 18 ปี","ฉันชื่อเอททีน","ฉันอยู่บ้านเลขที่ 18"],answer:1,explain:"years old ใช้บอกอายุ"},
  {prompt:"เลือกคำตอบของ How are you?",english:"How are you?",options:["I'm fine, thanks.","My name is Tom.","I'm from Thailand.","See you yesterday."],answer:0,explain:"I'm fine, thanks. เป็นคำตอบทั่วไปของ How are you?"},
  {prompt:"เลือกประโยคบอกประเทศ",english:"ฉันมาจากประเทศไทย",options:["I am Thailand.","I from Thai.","I am from Thailand.","I have Thailand."],answer:2,explain:"I am from Thailand = ฉันมาจากประเทศไทย"}
 ]},
 { id:"everyday", title:"Everyday expressions", sub:"วลีที่ใช้ในชีวิตประจำวัน", level:"Beginner 2", mins:7, xp:40, requiredXp:65, questions:[
  {prompt:"เลือกคำที่ใช้ขอบคุณ",english:"Thank you.",options:["ขอโทษ","ขอบคุณ","ไม่เป็นไร","ลาก่อน"],answer:1,explain:"Thank you = ขอบคุณ"},
  {prompt:"ถ้าต้องการขอโทษควรพูดว่าอะไร",english:"ขอโทษ",options:["Excuse me / I'm sorry","Good luck","You're welcome","See you"],answer:0,explain:"I'm sorry ใช้ขอโทษ ส่วน Excuse me ใช้ขอทางหรือเรียกความสนใจ"},
  {prompt:"เติมคำตอบ",english:"Thank you! — You're _____.",options:["fine","welcome","sorry","name"],answer:1,explain:"You're welcome = ด้วยความยินดี"},
  {prompt:"คำว่า Please ใช้เพื่ออะไร",english:"Please",options:["ทำให้คำขอสุภาพ","บอกลา","ถามอายุ","บอกเวลา"],answer:0,explain:"Please ทำให้คำขอสุภาพขึ้น"},
  {prompt:"เลือกวลีที่เหมาะกับการบอกลา",english:"แล้วพบกันใหม่",options:["See you later.","How old are you?","I'm from here.","Nice to eat you."],answer:0,explain:"See you later = แล้วพบกันใหม่"}
 ]},
 { id:"daily-routine", title:"My daily routine", sub:"กิจวัตรประจำวันและคำกริยาพื้นฐาน", level:"Beginner 2", mins:8, xp:45, requiredXp:105, questions:[
  {prompt:"เลือกคำแปลของ wake up",english:"I wake up at six.",options:["ฉันเข้านอนหกโมง","ฉันตื่นนอนตอนหกโมง","ฉันกินข้าวหกโมง","ฉันไปโรงเรียนหกโมง"],answer:1,explain:"wake up = ตื่นนอน"},
  {prompt:"เติมคำกริยา",english:"I _____ breakfast every morning.",options:["have","has","having","hadn't"],answer:0,explain:"I ใช้ have ใน present simple"},
  {prompt:"เลือกคำที่หมายถึงทำงาน",english:"work",options:["เล่น","นอน","ทำงาน","อ่าน"],answer:2,explain:"work = ทำงาน"},
  {prompt:"เลือกประโยคที่ถูกต้อง",english:"เขาไปโรงเรียนทุกวัน",options:["He go to school every day.","He goes to school every day.","He going school every day.","He gone to school every day."],answer:1,explain:"ประธาน He ใน present simple เติม -s/-es ที่กริยา"},
  {prompt:"คำว่า usually หมายถึงอะไร",english:"I usually walk to school.",options:["ไม่เคย","เมื่อวาน","โดยปกติ","พรุ่งนี้"],answer:2,explain:"usually = โดยปกติ"}
 ]},
 { id:"food-ordering", title:"Food and ordering", sub:"อาหาร การสั่งอาหาร และการขออย่างสุภาพ", level:"Beginner 3", mins:9, xp:50, requiredXp:150, questions:[
  {prompt:"สั่งน้ำหนึ่งแก้วอย่างสุภาพ",english:"ขอน้ำหนึ่งแก้วครับ/ค่ะ",options:["I water one.","Can I have a glass of water, please?","Where water is?","I am water."],answer:1,explain:"Can I have...? เป็นรูปแบบการขออย่างสุภาพ"},
  {prompt:"What does 'menu' mean?",english:"menu",options:["ใบเสร็จ","เมนูอาหาร","ห้องครัว","พนักงาน"],answer:1,explain:"menu = รายการอาหาร"},
  {prompt:"เติมคำ",english:"I'd like _____ chicken, please.",options:["some","many of","a few of","any of"],answer:0,explain:"some ใช้กับคำนามนับไม่ได้หรือปริมาณไม่ระบุชัด"},
  {prompt:"ต้องการขอเช็กบิลควรพูดว่าอะไร",english:"เช็กบิลด้วยครับ/ค่ะ",options:["The bill, please.","I'm the bill.","Where is menu?","Pay me food."],answer:0,explain:"The bill, please เป็นคำขอเช็กบิล"},
  {prompt:"คำว่า delicious หมายถึงอะไร",english:"This soup is delicious.",options:["เผ็ดมาก","เย็นมาก","อร่อย","แพง"],answer:2,explain:"delicious = อร่อย"}
 ]},
 { id:"directions", title:"Asking for directions", sub:"ถามทางและบอกตำแหน่ง", level:"Beginner 3", mins:9, xp:55, requiredXp:200, questions:[
  {prompt:"ถามว่าห้องน้ำอยู่ที่ไหน",english:"Where is the restroom?",options:["ห้องน้ำราคาเท่าไร","ห้องน้ำอยู่ที่ไหน","ห้องน้ำเปิดกี่โมง","นี่คือห้องน้ำไหม"],answer:1,explain:"Where is...? ใช้ถามตำแหน่ง"},
  {prompt:"คำว่า turn left หมายถึงอะไร",english:"Turn left at the corner.",options:["เลี้ยวขวา","เดินตรงไป","เลี้ยวซ้าย","กลับหลัง"],answer:2,explain:"turn left = เลี้ยวซ้าย"},
  {prompt:"เติมคำ",english:"Go _____ ahead.",options:["straight","leftly","near","behind of"],answer:0,explain:"go straight ahead = เดินตรงไป"},
  {prompt:"คำว่า opposite หมายถึงอะไร",english:"The bank is opposite the school.",options:["ข้างใน","ตรงข้าม","ข้างหลัง","ระหว่าง"],answer:1,explain:"opposite = ตรงข้าม"},
  {prompt:"เลือกคำถามขอความช่วยเหลือ",english:"ขอโทษครับ ช่วยบอกทางได้ไหม",options:["Excuse me, can you help me?","You are a road.","I need direction yesterday.","Where you go?"],answer:0,explain:"Excuse me, can you help me? เป็นการเริ่มขอความช่วยเหลืออย่างสุภาพ"}
 ]},
 { id:"past-tense", title:"What did you do yesterday?", sub:"เล่าเหตุการณ์ในอดีต", level:"Pre-intermediate", mins:10, xp:60, requiredXp:255, questions:[
  {prompt:"เลือก past tense ของ go",english:"go → ?",options:["goed","gone","went","goes"],answer:2,explain:"go เป็น irregular verb รูปอดีตคือ went"},
  {prompt:"เติมคำ",english:"I _____ a movie last night.",options:["watch","watched","watches","watching"],answer:1,explain:"last night บอกอดีต จึงใช้ watched"},
  {prompt:"เลือกประโยคที่ถูกต้อง",english:"เธอไม่ได้ไปโรงเรียนเมื่อวาน",options:["She didn't went to school.","She doesn't went to school.","She didn't go to school.","She not go school yesterday."],answer:2,explain:"didn't ตามด้วยกริยารูปพื้นฐาน"},
  {prompt:"คำถามอดีตที่ถูกต้อง",english:"_____ you see him yesterday?",options:["Do","Did","Are","Have"],answer:1,explain:"Did ใช้สร้างคำถาม past simple"},
  {prompt:"คำว่า bought เป็นอดีตของคำใด",english:"bought",options:["bring","buy","build","begin"],answer:1,explain:"buy → bought"}
 ]},
 { id:"future-plans", title:"Plans and predictions", sub:"พูดถึงแผนในอนาคต", level:"Pre-intermediate", mins:10, xp:65, requiredXp:315, questions:[
  {prompt:"เลือกประโยคพูดถึงอนาคต",english:"พรุ่งนี้ฉันจะอ่านหนังสือ",options:["I read yesterday.","I will study tomorrow.","I studied tomorrow.","I studying now."],answer:1,explain:"will + verb ใช้พูดถึงอนาคต"},
  {prompt:"เติมคำ",english:"She is going _____ visit her aunt.",options:["at","to","for","on"],answer:1,explain:"be going to + verb ใช้พูดถึงแผน"},
  {prompt:"เลือกคำแปลของ probably",english:"It will probably rain.",options:["แน่นอนว่า","อาจจะ/น่าจะ","เมื่อวาน","ไม่เคย"],answer:1,explain:"probably = น่าจะ"},
  {prompt:"เลือกคำถามเกี่ยวกับแผน",english:"สุดสัปดาห์นี้คุณจะทำอะไร",options:["What did you do last week?","What are you going to do this weekend?","Where were you born?","What do you ate?"],answer:1,explain:"What are you going to do...? ใช้ถามแผน"},
  {prompt:"เติมคำ",english:"I think they _____ arrive soon.",options:["will","was","did","are be"],answer:0,explain:"will + verb ใช้คาดการณ์อนาคต"}
 ]}
];
export function shuffle<T>(items: T[]): T[] {
 const result = [...items];
 for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
 return result;
}
