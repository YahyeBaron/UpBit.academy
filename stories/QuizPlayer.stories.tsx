import type { Meta, StoryObj } from '@storybook/react';
import QuizPlayer from '@/components/quiz-player';

const mockQuestions = [
  {
    id: 'q1',
    question: 'What is the primary benefit of React Server Components (RSC)?',
    points: 10,
    choices: [
      { id: 'c1', text: 'Zero bundle size impact on the client for server-only dependencies' },
      { id: 'c2', text: 'Automatic styling without CSS' },
      { id: 'c3', text: 'Client-side state management' },
      { id: 'c4', text: 'Replacement for database indexes' },
    ],
  },
  {
    id: 'q2',
    question: 'Which HTTP method should be used for safe, idempotent read queries?',
    points: 10,
    choices: [
      { id: 'c5', text: 'POST' },
      { id: 'c6', text: 'GET' },
      { id: 'c7', text: 'DELETE' },
      { id: 'c8', text: 'PATCH' },
    ],
  },
];

const meta: Meta<typeof QuizPlayer> = {
  title: 'Learning/QuizPlayer',
  component: QuizPlayer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuizPlayer>;

export const Default: Story = {
  args: {
    quizId: 'quiz-nextjs-basics',
    title: 'Next.js 15 & Architecture Quiz',
    description: 'Test your understanding of modern React and server-side paradigms.',
    questions: mockQuestions,
    passingScore: 70,
  },
};
