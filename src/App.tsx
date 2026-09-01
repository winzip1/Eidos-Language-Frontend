import React, { useState } from 'react';
import type { AppView } from './types';
import { DictionaryProvider } from './context/DictionaryContext';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { CourseProvider } from './context/CourseContext';
import { Shell } from './components/layout/Shell';
import { StudyDeskCenter } from './components/studyDesk';
import { DialogueStudyCenter } from './components/dialogues/DialogueStudyCenter';
import { InteractivePlayer } from './components/player/InteractivePlayer';
import { VocabularyCenter } from './components/vocabulary/VocabularyCenter';
import { ProgressDashboard } from './components/progress/ProgressDashboard';
import { LanguageHubCenter } from './components/languageHub/LanguageHubCenter';
import { SettingsModal } from './components/settings/SettingsModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Toaster } from 'sonner';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('studyDesk');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleNavigate = (view: AppView) => {
    if (view === 'settings') {
      setIsSettingsOpen(true);
      return;
    }
    if (view !== currentView) {
      setSearchQuery('');
    }
    setCurrentView(view);
  };

  const renderActiveScreen = () => {
    switch (currentView) {
      case 'languageHub':
        return (
          <LanguageHubCenter
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case 'dialogues':
        return (
          <DialogueStudyCenter
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case 'player':
        return (
          <InteractivePlayer
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case 'vocabulary':
        return (
          <VocabularyCenter
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case 'progress':
        return <ProgressDashboard onNavigate={handleNavigate} />;
      case 'studyDesk':
      case 'library':
      default:
        return (
          <StudyDeskCenter
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
    }
  };

  return (
    <Shell
      currentView={currentView}
      onNavigate={handleNavigate}
      onOpenSettings={() => setIsSettingsOpen(true)}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {renderActiveScreen()}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <Toaster position="bottom-right" richColors />
    </Shell>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DictionaryProvider>
        <AuthProvider>
          <CourseProvider>
            <PlayerProvider>
              <AppContent />
            </PlayerProvider>
          </CourseProvider>
        </AuthProvider>
      </DictionaryProvider>
    </ErrorBoundary>
  );
};

export default App;

