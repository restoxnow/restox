'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import ReportIssueModal from '@/components/ReportIssueModal'

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Report an issue"
        className="fixed bottom-16 right-6 z-40 w-9 h-9 rounded-full bg-gray-800 dark:bg-white/10 hover:bg-gray-700 dark:hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center shadow-lg transition-all duration-200 border border-white/10"
      >
        <HelpCircle size={16} />
      </button>
      {open && <ReportIssueModal onClose={() => setOpen(false)} />}
    </>
  )
}
