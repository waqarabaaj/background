import React, { useState } from 'react';
import {
  Home,
  Target,
  CheckSquare,
  Layers,
  FileText,
  Calendar,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Timer,
  Video,
  Camera,
  ArrowLeftRight,
  Ruler,
  QrCode,
  Volume2,
} from 'lucide-react';
import type { NavSection, ToolId } from '../../types';

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  onOpenTool: (tool: ToolId) => void;
  incompleteTaskCount: number;
  userInitial: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  onOpenTool,
  incompleteTaskCount,
  userInitial,
}) => {
  const [toolsOpen, setToolsOpen] = useState(true);

  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    sparkle?: boolean;
  }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'focus', label: 'Focus', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: incompleteTaskCount },
    { id: 'projects', label: 'Projects', icon: Layers },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, sparkle: true },
  ];

  const toolItems: Array<{
    id: ToolId;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
    { id: 'screen-recorder', label: 'Screen Recorder', icon: Video },
    { id: 'screenshot', label: 'Quick Capture', icon: Camera },
    { id: 'file-converter', label: 'File Converter', icon: ArrowLeftRight },
    { id: 'unit-converter', label: 'Unit Converter', icon: Ruler },
    { id: 'qr-generator', label: 'QR Generator', icon: QrCode },
    { id: 'text-to-speech', label: 'Text to Speech', icon: Volume2 },
  ];

  return (
    <aside className="w-[186px] xl:w-[196px] shrink-0 h-screen sticky top-0 flex flex-col justify-between bg-[#0c0a1d]/92 backdrop-blur-xl border-r border-purple-500/18 px-3 py-4 select-none z-20">
      <div className="flex flex-col min-h-0 overflow-y-auto pr-0.5">
        {/* Glowing Brand Monogram */}
        <button
          onClick={() => onSelectNav('home')}
          className="flex items-center gap-2.5 px-2 mb-5 group cursor-pointer text-left"
          title="Back to Home"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 via-purple-700/30 to-indigo-950/80 border border-purple-400/50 flex items-center justify-center shadow-[0_0_22px_rgba(139,92,246,0.55)] group-hover:shadow-[0_0_28px_rgba(167,139,250,0.75)] transition-all">
            <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(192,132,252,0.9)]">
              {userInitial.toUpperCase()}
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold tracking-wider uppercase text-purple-200/90">
              Command
            </div>
            <div className="text-[11px] text-purple-300/55">New Tab OS</div>
          </div>
        </button>

        {/* Primary Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'sidebar-active text-white'
                    : 'text-slate-300/80 hover:text-white hover:bg-purple-500/10 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-purple-200'
                        : item.sparkle
                        ? 'text-purple-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.sparkle && (
                    <span className="text-purple-400 text-xs leading-none">✦</span>
                  )}
                </span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-purple-600/90 text-white text-[11px] font-semibold flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.75)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="my-4 border-t border-purple-500/15" />

        {/* Collapsible Tools Drawer */}
        <div>
          <button
            onClick={() => setToolsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] font-semibold text-slate-300/85 hover:text-white transition-colors cursor-pointer"
          >
            <span>Tools</span>
            {toolsOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {toolsOpen && (
            <div className="mt-1 space-y-0.5">
              {toolItems.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() =>
                      tool.id === 'pomodoro' ? onSelectNav('focus') : onOpenTool(tool.id)
                    }
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12.5px] text-slate-300/75 hover:text-white hover:bg-purple-500/12 transition-all cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-purple-300/75 shrink-0" />
                    <span className="truncate">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Pinned Settings */}
      <div className="pt-3 border-t border-purple-500/15">
        <button
          onClick={() => onSelectNav('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
            activeNav === 'settings'
              ? 'sidebar-active text-white'
              : 'text-slate-300/80 hover:text-white hover:bg-purple-500/10 border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
