export type Course = {
  id: string;
  title: string;
  description: string | null;
  level?: string | null;
};

export type VocabularyWord = {
  id: string;
  word: string;
  meaning_th: string;
  example?: string | null;
  pronunciation?: string | null;
};
