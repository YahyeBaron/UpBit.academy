'use client';

import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  points: number;
  choices: { id: string; text: string }[];
}

interface QuizPlayerProps {
  quizId: string;
  title: string;
  description?: string;
  questions: Question[];
  passingScore?: number;
  onComplete?: (score: number, passed: boolean) => void;
}

export default function QuizPlayer({
  quizId,
  title,
  description,
  questions,
  passingScore = 70,
  onComplete,
}: QuizPlayerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const selectChoice = (questionId: string, choiceId: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({ score: data.score, passed: data.passed });
      if (onComplete) onComplete(data.score, data.passed);
    } catch {
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6 font-sans shadow-xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1">
          <HelpCircle size={14} /> Knowledge Check
        </div>
        <h3 className="text-xl font-black text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>

      {/* Result Card */}
      {result && (
        <div className={`p-6 rounded-2xl border flex flex-col items-center text-center space-y-3 ${
          result.passed
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {result.passed ? <Award size={36} className="text-emerald-400" /> : <XCircle size={36} className="text-rose-400" />}
          <div>
            <h4 className="text-lg font-black">{result.passed ? 'Quiz Passed!' : 'Needs Improvement'}</h4>
            <p className="text-sm mt-1">
              Your score: <span className="font-extrabold">{result.score}%</span> (Passing score: {passingScore}%)
            </p>
          </div>
          <button
            onClick={resetQuiz}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all mt-2"
          >
            <RotateCcw size={14} /> Try Again
          </button>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="space-y-3">
            <p className="text-sm font-extrabold text-white">
              {qIdx + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.choices.map((choice) => {
                const isSelected = answers[q.id] === choice.id;
                return (
                  <button
                    key={choice.id}
                    disabled={!!result}
                    onClick={() => selectChoice(q.id, choice.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md'
                        : 'bg-white/[0.02] border-white/10 text-gray-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{choice.text}</span>
                    {isSelected && <CheckCircle2 size={15} className="text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!result && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          {submitting ? 'Grading...' : 'Submit Answers'}
        </button>
      )}
    </div>
  );
}
