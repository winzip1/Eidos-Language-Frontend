import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../../context/AuthContext';
import { useDictionary } from '../../context/DictionaryContext';

export interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  defaultMode,
}) => {
  const { dict } = useDictionary();
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
  } = useAuth();

  const isOpen = propsIsOpen !== undefined ? propsIsOpen : isAuthModalOpen;
  const handleClose = propsOnClose || closeAuthModal;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    defaultMode || authModalMode || 'login'
  );

  // Synchronize internal active tab with AuthContext authModalMode changes
  useEffect(() => {
    if (authModalMode) {
      setActiveTab(authModalMode);
    }
  }, [authModalMode]);

  useEffect(() => {
    if (defaultMode) {
      setActiveTab(defaultMode);
    }
  }, [defaultMode]);

  const modalTitle = activeTab === 'login' ? dict.auth.loginTitle : dict.auth.registerTitle;
  const modalSubtitle = activeTab === 'login' ? dict.auth.loginSubtitle : dict.auth.registerSubtitle;
  const modalIcon = activeTab === 'login' ? (
    <LogIn className="w-4 h-4 text-ocean-600" />
  ) : (
    <UserPlus className="w-4 h-4 text-ocean-600" />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={modalIcon}
      maxWidthClass="max-w-md"
      closeButtonLabel={dict.buttons.close}
    >
      <div className="space-y-4">
        {/* Stripe/Linear Style Tab Switcher */}
        <div className="p-1 bg-slate-100/90 rounded-2xl flex border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              openAuthModal('login');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{dict.auth.loginTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              openAuthModal('register');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{dict.auth.registerTitle}</span>
          </button>
        </div>

        {/* Tab Forms */}
        {activeTab === 'login' ? (
          <LoginForm
            onSuccess={handleClose}
            onSwitchToRegister={() => {
              setActiveTab('register');
              openAuthModal('register');
            }}
            onContinueAsGuest={handleClose}
          />
        ) : (
          <RegisterForm
            onSuccess={handleClose}
            onSwitchToLogin={() => {
              setActiveTab('login');
              openAuthModal('login');
            }}
          />
        )}
      </div>
    </Modal>
  );
};
