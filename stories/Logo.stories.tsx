import type { Meta, StoryObj } from '@storybook/react';
import Logo from '@/components/logo';

const meta: Meta<typeof Logo> = {
  title: 'Brand/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {
    imageSize: 68,
  },
};

export const Small: Story = {
  args: {
    imageSize: 40,
  },
};

export const Large: Story = {
  args: {
    imageSize: 96,
  },
};
