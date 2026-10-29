export type LessonOption = {
  id: string;
  text: string;
  position: number;
};

export type LessonQuestion = {
  id: string;
  prompt: string;
  english: string;
  explain: string;
  options: LessonOption[];
};

export type LessonSummary = {
  id: string;
  title: string;
  sub: string;
  level: string;
  mins: number;
  xp: number;
  requiredXp: number;
};

export type LessonWithQuestions = LessonSummary & {
  questions: LessonQuestion[];
};

export type CheckedAnswer = {
  correct: boolean;
  correctOptionPosition: number;
};
