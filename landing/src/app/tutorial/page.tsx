'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageShell from '../components/PageShell';
import { Trophy, Users, Zap, MessageSquare, Monitor, Clock, Swords, ArrowRight, ChevronDown, CheckCircle2, BookOpen } from 'lucide-react';

const steps = [
  { id: 'overview', label: 'What is Retro Rivals?' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'workflow', label: 'Tournament Day' },
];

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-black text-white pt-16 pl-0 lg:pl-64">
      <PageShell />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Everything you need to know to compete at Retro Rivals.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-neutral-800/60 border border-gray-700/50 rounded-xl p-1 gap-1">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveSection(step.id)}
                className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === step.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION 1: OVERVIEW ===== */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Hero card */}
            <div className="relative rounded-2xl border border-purple-500/20 overflow-hidden">
              <img
                src="/images/EmptyHeaderBar.png"
                alt=""
                className="w-full object-cover h-48 sm:h-56"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-8 sm:p-10 text-center">
                <h2 className="text-3xl font-bold mb-3">Compete. Win. Level Up.</h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                  Retro Rivals is a competitive retro gaming platform where players go head-to-head in tournaments across classic titles.
                  Win matches, earn experience, unlock features, and prove you&apos;re the best.
                </p>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <FeatureCard
                icon={<Swords className="text-purple-400" size={28} />}
                title="Compete in Tournaments"
                description="Enter single or double elimination brackets across a variety of retro games. Every tournament is a chance to prove your skill."
                accent="purple"
              />
              <FeatureCard
                icon={<Zap className="text-yellow-400" size={28} />}
                title="Earn EXP & Multipliers"
                description="Every match you win earns you EXP. The deeper you go, the more you earn — and winning the tournament grants an EXP multiplier on top."
                accent="yellow"
              />
              <FeatureCard
                icon={<Users className="text-blue-400" size={28} />}
                title="Climb the Leaderboards"
                description="Accumulate EXP to rise through the global rankings. Higher levels unlock more site features over time."
                accent="blue"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setActiveSection('requirements')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
              >
                Next: Requirements
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===== SECTION 2: REQUIREMENTS ===== */}
        {activeSection === 'requirements' && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h2 className="text-3xl font-bold mb-2">Before You Play</h2>
              <p className="text-gray-400">Complete this checklist so you&apos;re ready when tournament day arrives.</p>
            </div>

            <div className="space-y-4">
              <ChecklistItem
                number={1}
                title="Read the Rules & Guidelines"
                description="Familiarize yourself with the tournament rules and expected player behavior before participating."
              >
                <Link
                  href="/rules"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <BookOpen size={14} />
                  Read the Rules
                  <ArrowRight size={14} />
                </Link>
              </ChecklistItem>

              <ChecklistItem
                number={2}
                title="Join Our Discord Server"
                description="All matches take place through Discord. This is where Game Masters coordinate your matches, and where you'll connect with your opponents."
              >
                <a
                  href="https://discord.gg/hjGrrbTKVT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <MessageSquare size={14} />
                  Join the Discord
                  <ArrowRight size={14} />
                </a>
              </ChecklistItem>

              <ChecklistItem
                number={3}
                title="Set Your Discord Display Name"
                description="Change your Discord display name to match your Retro Rivals username (or something recognizable). This is how Game Masters will find you for your match."
              />

              <ChecklistItem
                number={4}
                title="Sign Up for a Tournament"
                description="Browse the tournaments page and register before the sign-up deadline closes. Once sign-ups close, you can no longer enter."
              >
                <Link
                  href="/tournaments"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Trophy size={14} />
                  Browse Tournaments
                  <ArrowRight size={14} />
                </Link>
              </ChecklistItem>

              <ChecklistItem
                number={5}
                title="Install Required Software"
                description="Make sure you have all the software needed to play the game(s) for the tournament you're entering. This could be Fightcade, a specific emulator, or the original game client."
              >
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Monitor size={14} />
                  Check the tournament page for game-specific requirements
                </div>
              </ChecklistItem>

              <ChecklistItem
                number={6}
                title="Be Ready to Stream (If Needed)"
                description="If the tournament game doesn't have a built-in spectator mode, you'll need to stream your gameplay live in Discord so a Game Master can referee your match."
              />
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveSection('overview')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-700/50 rounded-xl font-medium transition-colors text-gray-300"
              >
                Back: Overview
              </button>
              <button
                onClick={() => setActiveSection('workflow')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
              >
                Next: Tournament Day
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===== SECTION 3: WORKFLOW ===== */}
        {activeSection === 'workflow' && (
          <div className="space-y-8">
            <div className="text-center mb-2">
              <h2 className="text-3xl font-bold mb-2">Tournament Day</h2>
              <p className="text-gray-400">Here&apos;s what to expect when the tournament begins.</p>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="space-y-5">
                <TimelineStep
                  number={1}
                  title="Join the Waiting Room"
                  description="At the tournament's starting time, head to the waiting room channel in Discord. This is where all players gather before their matches."
                  icon={<Clock size={20} />}
                  color="purple"
                />
                <TimelineStep
                  number={2}
                  title="Wait for Your Match"
                  description="Matches are played in bracket order, from top to bottom. Multiple matches may run simultaneously, so stay alert — your turn can come up quickly."
                  icon={<Users size={20} />}
                  color="blue"
                />
                <TimelineStep
                  number={3}
                  title="Play Your Match"
                  description="A Game Master will move you and your opponent into a dedicated match room in Discord. They'll walk you through the match setup and referee the game."
                  icon={<Swords size={20} />}
                  color="green"
                />
                <TimelineStep
                  number={4}
                  title="Return & Repeat"
                  description="After your match, the Game Master moves you back to the waiting room. If you won, you'll wait for your next match. If you lost, you're free to leave — or stick around and watch!"
                  icon={<Trophy size={20} />}
                  color="yellow"
                />
              </div>
            </div>

            {/* Quick FAQ */}
            <div className="bg-neutral-800/50 border border-gray-700/50 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-4">FAQ</h3>
              <div className="space-y-2">
                <FaqItem
                  index={0}
                  question="What happens if I'm late to the tournament?"
                  answer="If you're not present for your match, it's counted as a forfeit. There's no rescheduling — make sure to be in the waiting room on time."
                  expanded={expandedFaq}
                  onToggle={setExpandedFaq}
                />
                <FaqItem
                  index={1}
                  question="What if I disconnect mid-match?"
                  answer="Disconnections or crashes after a match starts are counted as forfeits unless the Game Master rules otherwise."
                  expanded={expandedFaq}
                  onToggle={setExpandedFaq}
                />
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveSection('requirements')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-700/50 rounded-xl font-medium transition-colors text-gray-300"
              >
                Back: Requirements
              </button>
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
              >
                Browse Tournaments
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ==================== Sub-components ==================== */

function FeatureCard({ icon, title, description, accent }: { icon: React.ReactNode; title: string; description: string; accent: string }) {
  const glowMap: Record<string, string> = {
    purple: 'hover:shadow-purple-500/10 hover:border-purple-500/30',
    yellow: 'hover:shadow-yellow-500/10 hover:border-yellow-500/30',
    green: 'hover:shadow-green-500/10 hover:border-green-500/30',
    blue: 'hover:shadow-blue-500/10 hover:border-blue-500/30',
  };

  return (
    <div className={`bg-neutral-800/50 border border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${glowMap[accent] || ''}`}>
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ChecklistItem({ number, title, description, children }: { number: number; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4 bg-neutral-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600/50 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-purple-400" />
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-base mb-1">
          <span className="text-purple-400 mr-1.5">{number}.</span>
          {title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        {children}
      </div>
    </div>
  );
}

function TimelineStep({ number, title, description, icon, color }: { number: number; title: string; description: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
    green: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full ${c.bg} border ${c.border} flex items-center justify-center ${c.text}`}>
        {icon}
      </div>
      <div className="bg-neutral-800/50 border border-gray-700/50 rounded-xl p-5 flex-1 hover:border-gray-600/50 transition-colors">
        <h3 className="font-semibold text-base mb-1">
          <span className={`${c.text} mr-1.5`}>Step {number}:</span>
          {title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ index, question, answer, expanded, onToggle }: { index: number; question: string; answer: string; expanded: number | null; onToggle: (i: number | null) => void }) {
  const isOpen = expanded === index;

  return (
    <button
      onClick={() => onToggle(isOpen ? null : index)}
      className="w-full text-left bg-neutral-900/50 border border-gray-700/40 rounded-lg p-4 hover:border-gray-600/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{question}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <p className="mt-3 text-gray-400 text-sm leading-relaxed">{answer}</p>
      )}
    </button>
  );
}
