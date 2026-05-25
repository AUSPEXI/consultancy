'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/firebase'

export type { UserTier } from '@/constants/tiers'

export interface UserData {
  tier: 'Free' | 'Basic' | 'Medium' | 'Pro' | 'Business' | 'Enterprise' | 'Premium' | 'PipelineOffer'
  role: 'admin' | 'user'
  email?: string | null
  onboardingCompleted?: boolean
  brand?: string
  domain?: string
  competitors?: string[]
  keywords?: string[]
  sentimentPrompts?: string[]
  latentAnchors?: Array<{ label: string; color: string; baseType: string }>
  cmsWebhookUrl?: string
  connectedSocials?: string[]
}

interface AuthContextType {
  user: User | null
  tier: UserData['tier']
  role: 'admin' | 'user'
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
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined

    const safetyTimeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimeout)
      setUser(currentUser)

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const isAdmin = currentUser.email === 'hopiumcalculator@gmail.com' || currentUser.email === 'sales@auspexi.com'

        // Resolve role immediately from email so tier-gated pages don't flash
        if (isAdmin) setRole('admin')

        // Unblock the dashboard shell immediately — Firestore data hydrates below
        setLoading(false)

        let firestoreAvailable = false
        try {
          // Timeout getDoc at 4s — "Database not found" hangs for ~30s otherwise
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('firestore-timeout')), 4000)
            ),
          ])
          firestoreAvailable = true
          if (!userDoc.exists()) {
            const initialData: UserData = {
              tier: 'Free',
              role: isAdmin ? 'admin' : 'user',
              email: currentUser.email,
              onboardingCompleted: false,
            }
            await setDoc(userDocRef, initialData)
            setTier('Free')
            setRole(initialData.role)
            setUserData(initialData)
          }
        } catch (error: any) {
          if (error?.message !== 'firestore-timeout') {
            console.error('Error creating user doc:', error)
          }
          // Firestore unavailable — dashboard runs without persisted user data
        }

        // Only subscribe if Firestore is reachable; avoids infinite retry spam
        if (firestoreAvailable) {
          unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserData
              const resolvedRole = isAdmin ? 'admin' : (data.role || 'user')
              setTier(data.tier || 'Free')
              setRole(resolvedRole)
              setUserData({
                ...data,
                role: resolvedRole,
                email: currentUser.email || data.email,
              })
            }
          })
        }
      } else {
        setTier('Free')
        setRole('user')
        setUserData(null)
        if (unsubscribeUserDoc) unsubscribeUserDoc()
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeUserDoc) unsubscribeUserDoc()
    }
  }, [])

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
        role,
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
