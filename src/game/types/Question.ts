export type QuestionSubject = 'math' | 'english';

export interface Question {
  id: string;
  subject: QuestionSubject;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
}
