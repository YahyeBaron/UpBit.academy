import type { Meta, StoryObj } from '@storybook/react';
import Navbar from '@/components/navbar';

const meta: Meta<typeof Navbar> = {
  title: 'Navigation/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/courses',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-[#05080f] pt-24 text-white p-6">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-12 space-y-4">
        <h1 className="text-3xl font-bold">Course Catalog Page Preview</h1>
        <p className="text-gray-400">
          The navigation bar stays fixed with backdrop blur and responsive desktop/mobile menus.
        </p>
      </div>
    </div>
  ),
};
