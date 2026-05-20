'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/firebase'

export interface UserData {
  tier: 'Free' | 'Basic' | 'Pro' | 'Business' | 'Enterprise' | 'PipelineOffer'
  role: 'admin' | 'user'
  email?: string | null
  onboardingCompleted?: boolean
  brand?: string
  domain?: string
  competitors?: string[]
  keywords?: string[]
}

interface AuthContextType {
  user: User | null
  tier: UserData['tier']
  userData: UserData | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [tier, setTier] = useState<UserData['tier']>('Free')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined

    const safetyTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimeout)
      setUser(currentUser)

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid)

        try {
          const userDoc = await getDoc(userDocRef)
          if (!userDoc.exists()) {
            const initialData: UserData = {
              tier: 'Free',
              role: 'user',
              email: currentUser.email,
              onboardingCompleted: false,
            }
            await setDoc(userDocRef, initialData)
            setTier('Free')
            setUserData(initialData)
          }
        } catch (error) {
          console.error('Error creating user doc:', error)
        }

        unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData
            setTier(data.tier || 'Free')
            setUserData({
              ...data,
              email: currentUser.email || data.email,
            })
          }
        })
      } else {
        setTier('Free')
        setUserData(null)
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc()
        }
      }
      setLoading(false)
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc()
      }
    }
  }, [loading])

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tier,
        userData,
        loading,
        signInWithGoogle: handleSignInWithGoogle,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
