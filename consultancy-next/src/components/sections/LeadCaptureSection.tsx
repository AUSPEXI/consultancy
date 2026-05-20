'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LeadCaptureSection() {
  const [email, setEmail] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGetReport = async () => {
    if (!email || !domain) {
      alert('Please enter your email and domain')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain }),
      })

      if (response.ok) {
        alert('Report generated and sent to your email!')
        setEmail('')
        setDomain('')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter your work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-zinc-900/80 border-zinc-800 text-white h-12"
        />
        <Input
          type="text"
          placeholder="Company domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-zinc-900/80 border-zinc-800 text-white h-12"
        />
      </div>
      <Button
        onClick={handleGetReport}
        disabled={loading}
        className="bg-white hover:bg-zinc-200 text-black h-12 w-full rounded-xl font-medium text-lg"
      >
        {loading ? 'Generating...' : 'Get Free Report'}
      </Button>
    </div>
  )
}
