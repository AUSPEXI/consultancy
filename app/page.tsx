'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

import { LandingPage } from '@/src/components/views/LandingPage';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-pink-500/30">
      <LandingPage />
    </main>
  );
}
