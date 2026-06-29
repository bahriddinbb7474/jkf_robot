export type QuestionSubject = 'math' | 'english';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subject: QuestionSubject;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}
