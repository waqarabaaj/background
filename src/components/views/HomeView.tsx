import React from 'react';
import type { AppData, NavSection, ToolId, TaskItem, ProjectItem, CalendarEvent, ShortcutItem, PomodoroSettings, NoteItem } from '../../types';
import type { PomodoroMode } from '../../hooks/usePomodoro';
import { SearchBar } from '../header/SearchBar';
import { ShortcutsRow } from '../header/ShortcutsRow';
import { TodaysFocusCard } from '../widgets/TodaysFocusCard';
import { PomodoroCard } from '../widgets/PomodoroCard';
import { CalendarCard } from '../widgets/CalendarCard';
import { SystemMonitorCard } from '../widgets/SystemMonitorCard';
import { QuickToolsCard } from '../widgets/QuickToolsCard';
import { GitHubActivityCard } from '../widgets/GitHubActivityCard';
import { ProjectBoardCard } from '../widgets/ProjectBoardCard';
import { NotesCard } from '../widgets/NotesCard';
import { BookmarksCard } from '../widgets/BookmarksCard';

interface HomeViewProps {
  data: AppData;
  pomodoro: {
    mode: PomodoroMode;
    running: boolean;
    remainingSec: number;
    progress: number;
    switchMode: (m: PomodoroMode) => void;
    toggleRunning: () => void;
    reset: () => void;
  };
  onNavigate: (nav: NavSection) => void;
  onOpenTool: (tool: ToolId) => void;
  onOpenNote: (noteId: string) => void;
  onUpdateSettings: (patch: Partial<AppData['settings']>) => void;
  onUpdatePomodoroSettings: (patch: Partial<PomodoroSettings>) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onAddShortcut: (item: Omit<ShortcutItem, 'id'>) => void;
  onDeleteShortcut: (id: string) => void;
  onAddEvent: (evt: Omit<CalendarEvent, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
  onAddProject: (p: Omit<ProjectItem, 'id' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, patch: Partial<ProjectItem>) => void;
  onAddNote: (title: string) => NoteItem;
  onAddBookmarkLink: (folderId: string, title: string, url: string) => void;
  onDeleteBookmarkLink: (folderId: string, linkId: string) => void;
  _unusedTaskType?: TaskItem;
}

export const HomeView: React.FC<HomeViewProps> = ({
  data,
  pomodoro,
  onNavigate,
  onOpenTool,
  onOpenNote,
  onUpdateSettings,
  onUpdatePomodoroSettings,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onAddShortcut,
  onDeleteShortcut,
  onAddEvent,
  onDeleteEvent,
  onAddProject,
  onUpdateProject,
  onAddNote,
  onAddBookmarkLink,
  onDeleteBookmarkLink,
}) => {
  return (
    <div className="space-y-4 pb-6">
      {/* Upper Hero Split: Search + Shortcuts on left, Today's Focus docked on right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center pt-1">
        <div className="xl:col-span-9 flex flex-col justify-center">
          <SearchBar
            engine={data.settings.searchEngine}
            onChangeEngine={(searchEngine) => onUpdateSettings({ searchEngine })}
          />
          <ShortcutsRow
            shortcuts={data.shortcuts}
            onAdd={onAddShortcut}
            onDelete={onDeleteShortcut}
          />
        </div>

        <div className="xl:col-span-3 h-full">
          <TodaysFocusCard
            tasks={data.tasks}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onOpenTasksView={() => onNavigate('tasks')}
          />
        </div>
      </div>

      {/* Middle 4-Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <PomodoroCard
          mode={pomodoro.mode}
          running={pomodoro.running}
          remainingSec={pomodoro.remainingSec}
          progress={pomodoro.progress}
          settings={data.settings.pomodoro}
          onSwitchMode={pomodoro.switchMode}
          onToggleRunning={pomodoro.toggleRunning}
          onReset={pomodoro.reset}
          onUpdateSettings={onUpdatePomodoroSettings}
          onExpand={() => onNavigate('focus')}
        />

        <CalendarCard
          events={data.events}
          onAddEvent={onAddEvent}
          onDeleteEvent={onDeleteEvent}
          onOpenCalendarView={() => onNavigate('calendar')}
        />

        <SystemMonitorCard
          helperUrl={data.settings.helperUrl}
          onOpenSettings={() => onNavigate('settings')}
        />

        <QuickToolsCard onOpenTool={onOpenTool} />
      </div>

      {/* Bottom 4-Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GitHubActivityCard
          username={data.settings.githubUsername}
          token={data.settings.githubToken}
          onSaveUsername={(githubUsername) => onUpdateSettings({ githubUsername })}
        />

        <ProjectBoardCard
          projects={data.projects}
          onAddProject={onAddProject}
          onUpdateProject={onUpdateProject}
          onOpenProjectsView={() => onNavigate('projects')}
        />

        <NotesCard
          notes={data.notes}
          onAddNote={onAddNote}
          onSelectNote={onOpenNote}
          onOpenNotesView={() => onNavigate('notes')}
        />

        <BookmarksCard
          folders={data.bookmarkFolders}
          syncChromeBookmarks={data.settings.syncChromeBookmarks}
          onToggleSyncChrome={(syncChromeBookmarks) =>
            onUpdateSettings({ syncChromeBookmarks })
          }
          onAddLink={onAddBookmarkLink}
          onDeleteLink={onDeleteBookmarkLink}
        />
      </div>
    </div>
  );
};
