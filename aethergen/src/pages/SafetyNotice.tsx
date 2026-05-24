import React from 'react'

export default function SafetyNotice() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Access Restricted</h1>
      <p className="mb-3">This capability is restricted by policy. If you believe this is an error, please contact support with your tenant ID.</p>
      <ul className="list-disc pl-6 text-sm text-gray-700">
        <li>Policy revocation or tenant revocation may be in effect</li>
        <li>Your geo-region may be denied per compliance rules</li>
        <li>Feature requires explicit entitlement and approval</li>
      </ul>
    </div>
  )
}


