import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import CertificateModal from '@/components/certificate-modal';

const meta: Meta<typeof CertificateModal> = {
  title: 'Credentials/CertificateModal',
  component: CertificateModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CertificateModal>;

function CertificateModalStory() {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-8">
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
      >
        View Certificate
      </button>
      <CertificateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        studentName="Hodan Warsame"
        courseTitle="Full-Stack Next.js 15 & React 19 Masterclass"
        instructorName="Sarah Lin & Yahye Baron"
        completionDate="September 2026"
        certificateId="BIT-CERT-2026-9901"
      />
    </div>
  );
}

export const OpenModal: Story = {
  render: () => <CertificateModalStory />,
};
