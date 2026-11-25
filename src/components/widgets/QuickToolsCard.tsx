import React from 'react';
import {
  Box,
  Video,
  Scan,
  ArrowLeftRight,
  QrCode,
  AudioLines,
  Ruler,
} from 'lucide-react';
import type { ToolId } from '../../types';

interface QuickToolsCardProps {
  onOpenTool: (tool: ToolId) => void;
}

export const QuickToolsCard: React.FC<QuickToolsCardProps> = ({ onOpenTool }) => {
  const tools: Array<{
    id: ToolId;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: 'screen-recorder', label: 'Screen Record', icon: Video },
    { id: 'screenshot', label: 'Screenshot', icon: Scan },
    { id: 'file-converter', label: 'File Convert', icon: ArrowLeftRight },
    { id: 'qr-generator', label: 'QR Generator', icon: QrCode },
    { id: 'text-to-speech', label: 'Text to Speech', icon: AudioLines },
    { id: 'unit-converter', label: 'Unit Convert', icon: Ruler },
  ];

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <Box className="w-4 h-4 text-purple-400" />
        <h2 className="text-[14.5px] font-semibold text-white">Quick Tools</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onOpenTool(tool.id)}
              className="tool-tile rounded-xl p-2.5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
            >
              <Icon className="w-5 h-5 text-purple-300" />
              <span className="text-[11px] font-medium text-slate-200 leading-tight">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
