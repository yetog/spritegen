import React from 'react';
import { Sparkles, History, Upload, Brain, Zap } from 'lucide-react';

interface SidebarProps {
  activeTab: 'generate' | 'gallery' | 'training' | 'mcp';
  setActiveTab: (tab: 'generate' | 'gallery' | 'training' | 'mcp') => void;
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen }) => {
  const menuItems = [
    { id: 'generate', label: 'Generate', icon: Sparkles },
    { id: 'gallery', label: 'Gallery', icon: History },
    { id: 'training', label: 'Training', icon: Upload },
    { id: 'mcp', label: 'MCP Tools', icon: Brain },
  ] as const;

  return (
    <div className={`fixed left-0 top-0 h-full bg-black/40 backdrop-blur-xl border-r border-amber-400/20 transition-all duration-300 z-50 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-amber-400/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl blur opacity-30"></div>
            <div className="relative bg-gradient-to-r from-amber-400 to-amber-600 p-3 rounded-xl">
              <Zap className="text-black" size={20} />
            </div>
          </div>
          {isOpen && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                SpriteForge
              </h1>
              <p className="text-amber-200/50 text-xs">AI-Powered</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-400/30'
                    : 'text-amber-100 hover:text-amber-300 hover:bg-white/5'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Status */}
      {isOpen && (
        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-black/30 rounded-xl p-4 border border-amber-400/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-amber-200 text-sm font-medium">System Online</span>
            </div>
            <p className="text-amber-200/70 text-xs">Ready to generate sprites</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;