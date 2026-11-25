import React, { useState } from 'react';
import type { NavSection, ToolId } from './types';
import { useAppStore } from './store/useAppStore';
import { usePomodoro } from './hooks/usePomodoro';
import { Sidebar } from './components/layout/Sidebar';
import { TopBanner } from './components/header/TopBanner';
import { HomeView } from './components/views/HomeView';
import { FocusView } from './components/views/FocusView';
import { TasksView } from './components/views/TasksView';
import { ProjectsView } from './components/views/ProjectsView';
import { NotesView } from './components/views/NotesView';
import { CalendarView } from './components/views/CalendarView';
import { AIAssistantView } from './components/views/AIAssistantView';
import { SettingsView } from './components/views/SettingsView';
import { ToolModal } from './components/tools/ToolModal';

export function App() {
  const store = useAppStore();
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const pomodoro = usePomodoro(
    store.data.settings.pomodoro,
    store.incrementPomodoroSessions
  );

  const incompleteTaskCount = store.data.tasks.filter((t) => !t.completed).length;
  const userInitial = (store.data.settings.userName.trim()[0] || 'W').toUpperCase();

  const handleOpenNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setActiveNav('notes');
  };

  const wallpaperBg = () => {
    const preset = store.data.settings.wallpaperPreset;
    if (preset === 'custom' && store.data.settings.customWallpaperDataUrl) {
      return {
        backgroundImage: `url(${store.data.settings.customWallpaperDataUrl})`,
      };
    }
    if (preset === 'aurora-violet') {
      return {
        backgroundImage:
          'radial-gradient(ellipse 85% 65% at 50% 0%, rgba(139,92,246,0.45), rgba(59,7,100,0.22) 55%, transparent 100%)',
      };
    }
    if (preset === 'midnight-minimal') {
      return {
        backgroundImage:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(79,70,229,0.25), transparent 100%)',
      };
    }
    return {
      backgroundImage: `url(./mountain-bg.jpg)`,
    };
  };

  return (
    <div className="min-h-screen flex bg-[#070612] text-white relative overflow-x-hidden">
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        onOpenTool={(tool) => setActiveTool(tool)}
        incompleteTaskCount={incompleteTaskCount}
        userInitial={userInitial}
      />

      {/* Main Content Stage with Cosmic Mountain Backdrop */}
      <div className="flex-1 min-w-0 relative flex flex-col">
        {/* Top Mountain / Cosmic Hero Scenery Layer */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[430px] overflow-hidden z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat opacity-95 scale-[1.01]"
            style={wallpaperBg()}
          />
          {/* Smooth atmospheric fade into midnight #070612 */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(7,6,18,0.22) 0%, rgba(12,8,28,0.28) 46%, rgba(7,6,18,0.88) 84%, #070612 100%)',
            }}
          />
          {/* Subtle violet radial horizon glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 65% 45% at 50% 35%, rgba(139,92,246,0.22), transparent 72%)',
            }}
          />
        </div>

        {/* Scrollable Workspace Content */}
        <main className="relative z-10 flex-1 px-5 xl:px-7 py-4 max-w-[1680px] w-full mx-auto">
          {/* Persistent Top Greeting + Live Clock + Real Weather Header */}
          <TopBanner
            settings={store.data.settings}
            onUpdateSettings={store.updateSettings}
          />

          {activeNav === 'home' && (
            <HomeView
              data={store.data}
              pomodoro={pomodoro}
              onNavigate={setActiveNav}
              onOpenTool={(tool) => setActiveTool(tool)}
              onOpenNote={handleOpenNote}
              onUpdateSettings={store.updateSettings}
              onUpdatePomodoroSettings={(patch) =>
                store.updateSettings({
                  pomodoro: { ...store.data.settings.pomodoro, ...patch },
                })
              }
              onToggleTask={store.toggleTask}
              onAddTask={(title) => store.addTask(title, { pinnedToToday: true })}
              onDeleteTask={store.deleteTask}
              onAddShortcut={store.addShortcut}
              onDeleteShortcut={store.deleteShortcut}
              onAddEvent={store.addEvent}
              onDeleteEvent={store.deleteEvent}
              onAddProject={store.addProject}
              onUpdateProject={store.updateProject}
              onAddNote={store.addNote}
              onAddBookmarkLink={store.addBookmarkLink}
              onDeleteBookmarkLink={store.deleteBookmarkLink}
            />
          )}

          {activeNav === 'focus' && (
            <FocusView
              pomodoro={pomodoro}
              settings={store.data.settings.pomodoro}
              tasks={store.data.tasks}
              onToggleTask={store.toggleTask}
              onUpdatePomodoro={(patch) =>
                store.updateSettings({
                  pomodoro: { ...store.data.settings.pomodoro, ...patch },
                })
              }
            />
          )}

          {activeNav === 'tasks' && (
            <TasksView
              tasks={store.data.tasks}
              onAddTask={store.addTask}
              onToggleTask={store.toggleTask}
              onUpdateTask={store.updateTask}
              onDeleteTask={store.deleteTask}
            />
          )}

          {activeNav === 'projects' && (
            <ProjectsView
              projects={store.data.projects}
              onAddProject={store.addProject}
              onUpdateProject={store.updateProject}
              onDeleteProject={store.deleteProject}
            />
          )}

          {activeNav === 'notes' && (
            <NotesView
              notes={store.data.notes}
              initialSelectedId={selectedNoteId}
              onAddNote={store.addNote}
              onUpdateNote={store.updateNote}
              onDeleteNote={store.deleteNote}
            />
          )}

          {activeNav === 'calendar' && (
            <CalendarView
              events={store.data.events}
              onAddEvent={store.addEvent}
              onDeleteEvent={store.deleteEvent}
            />
          )}

          {activeNav === 'ai' && (
            <AIAssistantView
              data={store.data}
              onSetMessages={store.setChatMessages}
              onUpdateSettings={store.updateSettings}
              onOpenSettings={() => setActiveNav('settings')}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              data={store.data}
              onUpdateSettings={store.updateSettings}
              onImportData={store.importData}
              onResetAll={store.resetAllData}
            />
          )}
        </main>
      </div>

      {/* Unified Quick Tools Modal */}
      <ToolModal
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onClose={() => setActiveTool(null)}
      />
    </div>
  );
}

export default App;
