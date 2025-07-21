import React from 'react';
import { Menu, Settings } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="bg-black/20 backdrop-blur-sm border-b border-amber-400/20 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 text-amber-200 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-all"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-amber-100">Sprite Generation Studio</h2>
            <p className="text-amber-200/70 text-sm">Create amazing character sprites with AI</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-sm rounded-lg border border-amber-400/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-amber-200 text-sm">Connected</span>
          </div>
          <button className="p-2 text-amber-200 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-all">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;