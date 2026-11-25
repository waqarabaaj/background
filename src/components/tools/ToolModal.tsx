import React, { useEffect } from 'react';
import {
  X,
  Video,
  Camera,
  ArrowLeftRight,
  QrCode,
  AudioLines,
  Ruler,
} from 'lucide-react';
import type { ToolId } from '../../types';
import { ScreenRecorderTool } from './ScreenRecorderTool';
import { ScreenshotTool } from './ScreenshotTool';
import { FileConverterTool } from './FileConverterTool';
import { QRGeneratorTool } from './QRGeneratorTool';
import { TextToSpeechTool } from './TextToSpeechTool';
import { UnitConverterTool } from './UnitConverterTool';

interface ToolModalProps {
  activeTool: ToolId | null;
  onSelectTool: (tool: ToolId) => void;
  onClose: () => void;
}

const TOOL_META: Array<{
  id: Exclude<ToolId, 'pomodoro'>;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'screen-recorder', label: 'Screen Recorder', icon: Video },
  { id: 'screenshot', label: 'Quick Capture', icon: Camera },
  { id: 'file-converter', label: 'File Converter', icon: ArrowLeftRight },
  { id: 'qr-generator', label: 'QR Generator', icon: QrCode },
  { id: 'text-to-speech', label: 'Text to Speech', icon: AudioLines },
  { id: 'unit-converter', label: 'Unit Converter', icon: Ruler },
];

export const ToolModal: React.FC<ToolModalProps> = ({
  activeTool,
  onSelectTool,
  onClose,
}) => {
  useEffect(() => {
    if (!activeTool) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTool, onClose]);

  if (!activeTool || activeTool === 'pomodoro') return null;

  const current = TOOL_META.find((t) => t.id === activeTool);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#110e24]/96 border border-purple-400/40 shadow-[0_24px_70px_rgba(0,0,0,0.88),0_0_40px_-10px_rgba(139,92,246,0.45)] overflow-hidden"
      >
        {/* Top Tool Switcher Bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-purple-500/20 bg-white/[0.02]">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {TOOL_META.map((t) => {
              const Icon = t.icon;
              const isSelected = t.id === activeTool;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTool(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.65)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Tool Body */}
        <div className="p-5 overflow-y-auto">
          <h3 className="text-base font-semibold text-white mb-4">
            {current?.label}
          </h3>
          {activeTool === 'screen-recorder' && <ScreenRecorderTool />}
          {activeTool === 'screenshot' && <ScreenshotTool />}
          {activeTool === 'file-converter' && <FileConverterTool />}
          {activeTool === 'qr-generator' && <QRGeneratorTool />}
          {activeTool === 'text-to-speech' && <TextToSpeechTool />}
          {activeTool === 'unit-converter' && <UnitConverterTool />}
        </div>
      </div>
    </div>
  );
};
