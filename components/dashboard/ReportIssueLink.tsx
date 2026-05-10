'use client'

import { useState } from 'react'
import ReportIssueModal from '@/components/ReportIssueModal'

export default function ReportIssueLink() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
      >
        Report an Issue
      </button>
      {open && <ReportIssueModal onClose={() => setOpen(false)} />}
    </>
  )
}
