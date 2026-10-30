"use client";

import { useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { AlertCircle, BookOpen, Bookmark, LoaderCircle, Search, Volume2 } from "lucide-react";

type VocabularyWord = {
  id: string;
  word: string;
  meaning_th: string;
  pronunciation: string | null;
  example: string | null;
  example_th: string | null;
};

export default function VocabularyPage() {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVocabulary() {
      try {
        const response = await fetch("/api/vocabulary", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "ไม่สามารถโหลดคำศัพท์ได้");
        }

        if (!cancelled) {
          setWords(Array.isArray(payload.data) ? payload.data : []);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการโหลดคำศัพท์");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVocabulary();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase();

    if (!keyword) return words;

    return words.filter((word) =>
      [
        word.word,
        word.meaning_th,
        word.pronunciation ?? "",
        word.example ?? "",
        word.example_th ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(keyword),
    );
  }, [query, words]);

  function toggleSaved(word: string) {
    setSaved((current) =>
      current.includes(word)
        ? current.filter((item) => item !== word)
        : [...current, word],
    );
  }

  function speak(word: string) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="shell py-7 md:py-9">
      <div className="app-layout flex gap-9">
        <AppSidebar />
        <section className="min-w-0 flex-1">
          <p className="eyebrow">YOUR WORD COLLECTION</p>
          <h1 className="mt-1 text-3xl font-extrabold">
            คลังคำศัพท์ <span className="text-[#24a982]">.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            รวมคำศัพท์จากฐานข้อมูล DevLingo พร้อมความหมาย คำอ่าน และตัวอย่างการใช้งาน
          </p>

          <div className="relative mt-6 max-w-xl">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาคำศัพท์ ความหมาย หรือตัวอย่าง..."
              aria-label="ค้นหาคำศัพท์"
              className="w-full rounded-2xl border border-[#e5ece7] bg-white py-4 pl-12 pr-4 outline-none transition focus:border-[#24a982]"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-500">
              {loading ? "กำลังโหลดคำศัพท์..." : `พบ ${filtered.length} จาก ${words.length} คำ`}
            </p>
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Bookmark size={14} />
              {saved.length} คำที่บันทึกในหน้านี้
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">โหลดคลังคำศัพท์ไม่สำเร็จ</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 font-extrabold underline"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="panel mt-5 flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate-400">
              <LoaderCircle size={20} className="animate-spin" />
              กำลังดึงคำศัพท์จาก Supabase...
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {filtered.map((word) => {
                const isSaved = saved.includes(word.word);

                return (
                  <article key={word.id} className="panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-2xl font-extrabold text-[#208d6b]">
                          {word.word}
                        </h2>
                        {word.pronunciation && (
                          <p className="mt-1 text-xs text-slate-400">
                            {word.pronunciation}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          aria-label={`ฟังเสียง ${word.word}`}
                          onClick={() => speak(word.word)}
                          className="rounded-xl bg-[#eff9f3] p-2.5 text-[#208d6b] transition hover:bg-[#dff4e8]"
                        >
                          <Volume2 size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${isSaved ? "ยกเลิกบันทึก" : "บันทึก"} ${word.word}`}
                          aria-pressed={isSaved}
                          onClick={() => toggleSaved(word.word)}
                          className={`rounded-xl p-2.5 transition ${isSaved ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500 hover:bg-violet-50"}`}
                        >
                          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>

                    <p className="mt-4 font-bold">{word.meaning_th}</p>

                    {(word.example || word.example_th) && (
                      <div className="mt-4 rounded-xl bg-[#f6f8f6] p-3">
                        {word.example && (
                          <p className="text-sm font-semibold">{word.example}</p>
                        )}
                        {word.example_th && (
                          <p className="mt-1 text-xs text-slate-500">{word.example_th}</p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="panel mt-5 p-10 text-center">
              <BookOpen size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 font-bold">
                {words.length === 0 ? "ยังไม่มีคำศัพท์ในฐานข้อมูล" : "ไม่พบคำศัพท์"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {words.length === 0
                  ? "เพิ่มคำศัพท์ในตาราง public.vocabulary แล้วรีเฟรชหน้านี้"
                  : "ลองค้นหาด้วยคำอื่น"}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
