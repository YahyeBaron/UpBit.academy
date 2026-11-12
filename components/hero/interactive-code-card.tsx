'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bug, Zap, Trophy, RotateCcw, ChevronRight, Star, Code2 } from 'lucide-react';

/* ─── Challenge data ──────────────────────────────────────────────── */
interface Challenge {
  id: number;
  label: string;
  lang: string;
  lines: string[];
  bugLine: number;          // 0-indexed
  hint: string;
  explanation: string;
  xp: number;
}

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    label: 'React Hook Order',
    lang: 'tsx',
    lines: [
      'export function Counter() {',
      '  if (count > 10) return null;',
      '  const [count, setCount] = useState(0);',
      '  return <button onClick={() => setCount(c => c + 1)}>',
      '    {count}',
      '  </button>;',
      '}',
    ],
    bugLine: 1,
    hint: 'Hooks must be called unconditionally.',
    explanation: 'You cannot call a Hook after a conditional return. Move the useState before the if-check.',
    xp: 30,
  },
  {
    id: 2,
    label: 'Async/Await Mistake',
    lang: 'ts',
    lines: [
      'async function fetchUser(id: string) {',
      '  const res = fetch(`/api/user/${id}`);',
      '  if (!res.ok) throw new Error("Not found");',
      '  return res.json();',
      '}',
    ],
    bugLine: 1,
    hint: 'fetch() returns a Promise — did you await it?',
    explanation: '`fetch()` is async. Without `await`, `res` is a Promise, so `res.ok` and `res.json()` will fail at runtime.',
    xp: 25,
  },
  {
    id: 3,
    label: 'Prisma Unique Conflict',
    lang: 'ts',
    lines: [
      'await prisma.user.create({',
      '  data: { email, name },',
      '  where: { email },',
      '});',
    ],
    bugLine: 2,
    hint: '`create` does not accept a `where` clause.',
    explanation: 'Prisma\'s `create` has no `where` option. Use `upsert` instead if you want create-or-update semantics.',
    xp: 35,
  },
  {
    id: 4,
    label: 'Next.js Metadata Export',
    lang: 'tsx',
    lines: [
      '"use client";',
      '',
      'export const metadata = {',
      '  title: "Dashboard",',
      '};',
      '',
      'export default function Page() {',
      '  return <main>Hello</main>;',
      '}',
    ],
    bugLine: 0,
    hint: 'Can you export metadata from a Client Component?',
    explanation: '`metadata` exports only work in Server Components. Remove `"use client"` or move the metadata to a separate server layout/page.',
    xp: 40,
  },
  {
    id: 5,
    label: 'CSS-in-JS Specificity',
    lang: 'ts',
    lines: [
      'const styles = {',
      '  color: "red",',
      '  font-size: "16px",',
      '  background: "#000",',
      '};',
    ],
    bugLine: 2,
    hint: 'Inline style keys must be camelCase in JavaScript.',
    explanation: '`font-size` is not a valid JS property name in an object literal. Use `fontSize: "16px"` (camelCase).',
    xp: 20,
  },
];

/* ─── XP bar component ──────────────────────────────────────────── */
function XpBar({ xp, max = 150 }: { xp: number; max?: number }) {
  const pct = Math.min((xp / max) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─── Main game component ───────────────────────────────────────── */
export default function InteractiveCodeCard() {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const [done, setDone] = useState(false);

  const challenge = CHALLENGES[challengeIdx];
  const isCorrect = selected === challenge.bugLine;

  const handleGuess = useCallback((lineIdx: number) => {
    if (answered) return;
    setSelected(lineIdx);
    setAnswered(true);

    if (lineIdx === challenge.bugLine) {
      const bonus = streak >= 2 ? Math.round(challenge.xp * 0.5) : 0;
      setXp((v) => v + challenge.xp + bonus);
      setStreak((s) => s + 1);
      setTotalCorrect((c) => c + 1);
      setFlash('correct');
    } else {
      setStreak(0);
      setFlash('wrong');
    }
    setTimeout(() => setFlash(null), 600);
  }, [answered, challenge, streak]);

  const handleNext = useCallback(() => {
    if (challengeIdx + 1 >= CHALLENGES.length) {
      setDone(true);
    } else {
      setChallengeIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
      setShowExplanation(false);
    }
  }, [challengeIdx]);

  const handleRestart = () => {
    setChallengeIdx(0);
    setSelected(null);
    setAnswered(false);
    setShowExplanation(false);
    setXp(0);
    setStreak(0);
    setTotalCorrect(0);
    setDone(false);
  };

  /* ── Keyboard shortcut: Enter to advance ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && answered) handleNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, handleNext]);

  /* ── Done screen ── */
  if (done) {
    return (
      <div className="relative w-full rounded-2xl border border-blue-500/30 bg-[#0B0F19]/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col items-center justify-center p-10 gap-6 text-center min-h-[420px]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Trophy size={30} />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">All Challenges Complete!</p>
          <h3 className="text-2xl font-black text-white mb-1">{xp} XP Earned</h3>
          <p className="text-gray-400 text-sm">
            {totalCorrect} of {CHALLENGES.length} correct &bull; Best streak: {streak}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {CHALLENGES.map((c, i) => (
            <span
              key={c.id}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                i < totalCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {i < totalCorrect ? '✓' : '✗'}
            </span>
          ))}
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
        >
          <RotateCcw size={14} /> Play Again
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl border bg-[#0B0F19]/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${
        flash === 'correct'
          ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
          : flash === 'wrong'
          ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
          : 'border-blue-500/20 hover:border-blue-500/40'
      }`}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-black/40">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="h-3.5 w-px bg-white/10 mx-1.5" />
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
            <Bug size={12} className="text-red-400" />
            <span>debug-challenge.{challenge.lang}</span>
          </div>
        </div>

        {/* XP & streak */}
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Zap size={10} className="fill-amber-400" /> {streak}× streak
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-300">
            <Star size={11} className="fill-blue-400 text-blue-400" /> {xp} XP
          </span>
        </div>
      </div>

      {/* ── Progress & instruction ── */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
          <span className="font-bold text-blue-400 uppercase tracking-widest">{challenge.label}</span>
          <span>{challengeIdx + 1} / {CHALLENGES.length}</span>
        </div>
        <XpBar xp={xp} />
        <p className="mt-2 text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
          <Code2 size={11} className="text-blue-400 shrink-0" />
          Click the line containing the bug ↓
        </p>
      </div>

      {/* ── Code lines (clickable) ── */}
      <div className="px-2 py-3 font-mono text-[12px] leading-relaxed bg-[#070A12]/90 select-none">
        {challenge.lines.map((line, idx) => {
          const isBug = idx === challenge.bugLine;
          const isSelected = idx === selected;
          const isBlankLine = line.trim() === '';

          let lineClass =
            'flex items-start gap-2 px-2 py-[3px] rounded-md cursor-pointer transition-all duration-200 group';

          if (answered) {
            if (isBug) lineClass += ' bg-emerald-500/10 border border-emerald-500/30';
            else if (isSelected && !isBug) lineClass += ' bg-red-500/10 border border-red-500/30';
            else lineClass += ' opacity-40';
          } else if (isBlankLine) {
            lineClass += ' cursor-default';
          } else {
            lineClass += ' hover:bg-blue-500/10 hover:border hover:border-blue-500/20';
          }

          return (
            <div
              key={idx}
              className={lineClass}
              onClick={() => !isBlankLine && handleGuess(idx)}
            >
              <span className="shrink-0 w-5 text-right text-gray-600 text-[10px] mt-0.5 group-hover:text-gray-400 transition-colors select-none">
                {idx + 1}
              </span>
              <span
                className={`whitespace-pre flex-1 ${
                  answered && isBug
                    ? 'text-emerald-300'
                    : answered && isSelected && !isBug
                    ? 'text-red-400'
                    : 'text-gray-300'
                }`}
              >
                {line || '\u00A0'}
              </span>
              {answered && isBug && (
                <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  BUG
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Hint (before answer) ── */}
      {!answered && (
        <div className="px-4 py-2.5 border-t border-white/5 bg-black/30">
          <p className="text-[11px] text-gray-500 italic flex items-center gap-1.5">
            <span className="text-blue-500">💡</span> Hint: {challenge.hint}
          </p>
        </div>
      )}

      {/* ── Result feedback ── */}
      {answered && (
        <div className={`px-4 py-3 border-t ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className={`text-xs font-black mb-0.5 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                {isCorrect
                  ? `+${challenge.xp + (streak > 1 ? Math.round(challenge.xp * 0.5) : 0)} XP${streak > 1 ? ' (streak bonus!)' : ''} — Correct!`
                  : 'Not quite — the bug is highlighted above'}
              </p>
              {showExplanation && (
                <p className="text-[11px] text-gray-400 leading-relaxed">{challenge.explanation}</p>
              )}
            </div>
            {!showExplanation && (
              <button
                onClick={() => setShowExplanation(true)}
                className="shrink-0 text-[10px] font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 whitespace-nowrap"
              >
                Why?
              </button>
            )}
          </div>

          <button
            onClick={handleNext}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wide transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98]"
          >
            {challengeIdx + 1 < CHALLENGES.length ? (
              <><ChevronRight size={13} /> Next Challenge</>
            ) : (
              <><Trophy size={13} /> See Results</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
