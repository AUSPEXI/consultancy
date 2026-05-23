import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface BackButtonProps {
  to?: string
  label?: string
}

const BackButton: React.FC<BackButtonProps> = ({ to, label = 'Back' }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to)
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 shadow-sm"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </button>
  )
}

export default BackButton


