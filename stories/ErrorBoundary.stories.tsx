import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulation of unexpected runtime rendering crash');
  }
  return (
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
      Everything is running smoothly without errors.
    </div>
  );
}

const meta: Meta<typeof ErrorBoundary> = {
  title: 'Feedback/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const NormalState: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyComponent shouldThrow={false} />
    </ErrorBoundary>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <ErrorBoundary fallbackTitle="Component Crash Captured" fallbackMessage="Graceful fallback prevents whole page breakdown.">
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};
