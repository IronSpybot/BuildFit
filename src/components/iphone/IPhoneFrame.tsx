import React from 'react';
import { LayoutDashboard, PlusCircle, UserCircle2 } from 'lucide-react';
import { DynamicIsland } from './DynamicIsland';
import { haptic } from '../../utils/haptics';

interface IPhoneFrameProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'log' | 'profile';
  onTabChange: (tab: 'dashboard' | 'log' | 'profile') => void;
  stepCount: number;
  activeCalories: number;
  lastAction?: string;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  stepCount,
  activeCalories,
  lastAction,
}) => {
  return (
    <div className="relative mx-auto my-auto flex items-center justify-center select-none py-2">
      {/* Outer Titanium Chassis */}
      <div className="relative w-[393px] h-[852px] rounded-[55px] bg-[#1a1a1a] p-[10px] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12),inset_0_0_0_2px_#333] border border-neutral-700/50 flex flex-col overflow-hidden">
        
        {/* Subtle Specular Titanium Edge Highlights */}
        <div className="absolute inset-0 rounded-[55px] pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-60" />

        {/* OLED True Black Display Area */}
        <div className="relative w-full h-full rounded-[46px] bg-[#000000] overflow-hidden flex flex-col shadow-inner">
          
          {/* Dynamic Island & iOS Status Bar */}
          <DynamicIsland
            stepCount={stepCount}
            activeCalories={activeCalories}
            lastAction={lastAction}
          />

          {/* Main Scrollable Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-none">
            {children}
          </div>

          {/* iOS 27 Frosted Glass Bottom Tab Bar */}
          <div className="absolute bottom-0 inset-x-0 h-[84px] bg-neutral-950/80 backdrop-blur-2xl border-t border-white/10 px-6 pt-2 pb-6 flex items-center justify-around z-40">
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => {
                haptic.trigger('light');
                onTabChange('dashboard');
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'dashboard'
                  ? 'text-emerald-400 scale-105'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-semibold tracking-tight">
                Dashboard
              </span>
            </button>

            {/* Tab 2: Log Meal */}
            <button
              onClick={() => {
                haptic.trigger('light');
                onTabChange('log');
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'log'
                  ? 'text-emerald-400 scale-105'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-semibold tracking-tight">
                Log Meal
              </span>
            </button>

            {/* Tab 3: Profile */}
            <button
              onClick={() => {
                haptic.trigger('light');
                onTabChange('profile');
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'profile'
                  ? 'text-emerald-400 scale-105'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <UserCircle2 className="w-5 h-5 stroke-[2.2]" />
              <span className="text-[10px] font-semibold tracking-tight">
                Profile
              </span>
            </button>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-50">
            <div className="w-32 h-1 bg-white/35 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
