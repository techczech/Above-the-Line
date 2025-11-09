import React from 'react';
import { Theme } from '../types';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onNavigateHome: () => void;
  onNavigateToAbout: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, setTheme, onNavigateHome, onNavigateToAbout }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="flex justify-between items-center mb-4 md:mb-6">
      <div onClick={onNavigateHome} className="cursor-pointer">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Above The Line
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Your companion for exploring texts.
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onNavigateToAbout}
          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-lg">info</span>
          About
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <MoonIcon className="text-2xl" /> : <SunIcon className="text-2xl" />}
        </button>
      </div>
    </header>
  );
};

export default Header;