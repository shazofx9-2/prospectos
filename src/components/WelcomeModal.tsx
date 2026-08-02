import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProspectOSLogo from './ProspectOSLogo';
import {
  Sparkles,
  TrendingUp,
  Users,
  CheckSquare,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Search,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Calendar
} from 'lucide-react';

interface WelcomeModalProps {
  userName: string;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userName, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const features = [
    {
      icon: TrendingUp,
      badge: 'Pipeline',
      title: 'Sales & Lead Pipeline',
      description: 'Organize prospects across customizable stages from initial contact to negotiation and closing. Keep every deal moving forward effortlessly.'
    },
    {
      icon: Mail,
      badge: 'Email Outreach',
      title: 'Email Follow-Up Assistant',
      description: 'Dispatch personalized email follow-ups via connected accounts with customizable templates, variable tags, and automated follow-up scheduling.'
    },
    {
      icon: Calendar,
      badge: 'Calendar Sync',
      title: 'Google Calendar Integration',
      description: 'Automatically synchronize follow-up schedules, sales meetings, and client deadlines directly into your Google Calendar in real time.'
    },
    {
      icon: Users,
      badge: 'Clients',
      title: 'Active Client Hub',
      description: 'Centralize active retainer contracts, client contact records, project scopes, and renewal dates in one secure workspace.'
    },
    {
      icon: CheckSquare,
      badge: 'Operations',
      title: 'Operational Tasks & Reminders',
      description: 'Schedule automated follow-ups, set priority reminders, and ensure no client commitment or deadline falls through the cracks.'
    },
    {
      icon: BarChart3,
      badge: 'Intelligence',
      title: 'Revenue & Growth Analytics',
      description: 'Gain real-time clarity into monthly recurring revenue (MRR), deal win rates, pipeline velocity, and conversion forecasting.'
    }
  ];

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const activeFeature = features[currentStep];
  const IconComponent = activeFeature.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-white/10 overflow-hidden my-8 bg-zinc-950"
      >
        {/* Monochromatic background ambient glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-800/20 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="space-y-6 text-left">
          {/* Header Banner */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-zinc-300 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-zinc-200" />
                <span>Welcome Onboard</span>
              </div>
              <ProspectOSLogo className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-white tracking-normal">
              Happy to have you, {userName || 'Partner'}!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Let's take a quick look at how ProspectOS powers your sales and client management.
            </p>
          </div>

          {/* Animated Feature Showcase Step */}
          <div className="relative min-h-[200px] p-5 sm:p-6 rounded-2xl bg-white/3 border border-white/10 space-y-4">
            {/* Step indicator pills */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                Feature {currentStep + 1} of {features.length}
              </span>
              <div className="flex items-center gap-1.5">
                {features.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStep ? 'w-6 bg-white' : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  {/* Theme matching monochrome icon container */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white shrink-0 shadow-inner">
                    <IconComponent className="w-6 h-6 text-zinc-200" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {activeFeature.badge}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {activeFeature.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                  {activeFeature.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pro Tip Banner */}
          <div className="p-3 rounded-xl bg-white/3 border border-white/8 flex items-center gap-3 text-xs text-zinc-300">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 text-zinc-300">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-white">Pro Tip</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-200 font-mono text-[10px]">K</kbd> anytime to search prospects and tasks instantly.
              </p>
            </div>
          </div>

          {/* Action Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 border border-white/10 hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 shadow-xl cursor-pointer transition-all flex items-center gap-2 group"
            >
              <span>{currentStep === features.length - 1 ? 'Get Down to Business' : 'Next Feature'}</span>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
