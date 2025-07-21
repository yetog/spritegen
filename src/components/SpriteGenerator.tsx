import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Wand2, Loader2, Image as ImageIcon, MessageCircle, Send, Bot, User, ArrowRight } from 'lucide-react';
import { generateSprite, sendChat } from '../services/api';
import { Sprite } from '../types/sprite';

interface SpriteGeneratorProps {
  onSpriteGenerated: (sprite: Sprite) => void;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

const SpriteGenerator: React.FC<SpriteGeneratorProps> = ({ onSpriteGenerated }) => {
  const [formData, setFormData] = useState({
    character: '',
    pose: '',
    style: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSprite, setGeneratedSprite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      message: 'Hello! I\'m your AI sprite assistant. I can help you create better sprite descriptions, suggest character ideas, poses, and styles. What kind of sprite are you looking to create?',
      timestamp: new Date()
    }
  ]);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.character.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateSprite({
        character: formData.character,
        pose: formData.pose,
        style: formData.style
      });

      const sprite: Sprite = {
        id: Date.now().toString(),
        character: formData.character,
        pose: formData.pose,
        style: formData.style,
        imageBase64: result.image_base64,
        createdAt: new Date().toISOString(),
        rating: 0
      };

      setGeneratedSprite(result.image_base64);
      onSpriteGenerated(sprite);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sprite');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChatMessage.trim() || isChatLoading) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      message: currentChatMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentChatMessage('');
    setIsChatLoading(true);

    try {
      const botResponse = await sendChat(currentChatMessage);
      
      const botMessage: ChatMessage = {
        sender: 'bot',
        message: botResponse,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        sender: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const applySuggestion = (type: 'CHARACTER' | 'POSE' | 'STYLE', value: string) => {
    const field = type.toLowerCase() as keyof typeof formData;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseSuggestions = (message: string) => {
    const suggestions: Array<{ type: 'CHARACTER' | 'POSE' | 'STYLE'; value: string }> = [];
    
    const characterMatch = message.match(/\[CHARACTER:\s*([^\]]+)\]/);
    const poseMatch = message.match(/\[POSE:\s*([^\]]+)\]/);
    const styleMatch = message.match(/\[STYLE:\s*([^\]]+)\]/);

    if (characterMatch) suggestions.push({ type: 'CHARACTER', value: characterMatch[1].trim() });
    if (poseMatch) suggestions.push({ type: 'POSE', value: poseMatch[1].trim() });
    if (styleMatch) suggestions.push({ type: 'STYLE', value: styleMatch[1].trim() });

    return suggestions;
  };

  const renderChatMessage = (msg: ChatMessage, index: number) => {
    const suggestions = parseSuggestions(msg.message);
    const cleanMessage = msg.message.replace(/\[(CHARACTER|POSE|STYLE):[^\]]+\]/g, '').trim();

    return (
      <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        {msg.sender === 'bot' && (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-black" />
          </div>
        )}
        
        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          msg.sender === 'user' 
            ? 'bg-amber-400/20 text-amber-100 border border-amber-400/30' 
            : 'bg-black/30 text-amber-200 border border-amber-400/20'
        }`}>
          <p className="text-sm">{cleanMessage}</p>
          
          {suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => applySuggestion(suggestion.type, suggestion.value)}
                  className="flex items-center gap-2 w-full px-3 py-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 hover:border-amber-400/40 rounded-lg text-amber-300 hover:text-amber-200 transition-all text-xs"
                >
                  <ArrowRight size={12} />
                  <span className="font-medium">{suggestion.type}:</span>
                  <span>{suggestion.value}</span>
                </button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-amber-400/50 mt-2">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {msg.sender === 'user' && (
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
            <h2 className="text-xl font-semibold text-amber-100 mb-6 flex items-center gap-2">
              <Wand2 size={20} className="text-amber-400" />
              Sprite Parameters
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Character *
                </label>
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => handleInputChange('character', e.target.value)}
                  placeholder="e.g., Ren, Kira, mysterious mage"
                  className="w-full px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Pose
                </label>
                <input
                  type="text"
                  value={formData.pose}
                  onChange={(e) => handleInputChange('pose', e.target.value)}
                  placeholder="e.g., idle, walking, attacking, casting spell"
                  className="w-full px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Style
                </label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  placeholder="e.g., anime, pixel art, battle outfit, magical"
                  className="w-full px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !formData.character.trim()}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold py-3 px-6 rounded-xl hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Sprite
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-400/20 rounded-xl">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
            <h3 className="text-lg font-medium text-amber-100 mb-4">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { character: 'Warrior', pose: 'battle stance', style: 'fantasy armor' },
                { character: 'Mage', pose: 'casting spell', style: 'magical robes' },
                { character: 'Rogue', pose: 'stealth', style: 'dark hood' },
                { character: 'Archer', pose: 'drawing bow', style: 'forest ranger' }
              ].map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setFormData(preset)}
                  className="p-3 bg-black/30 border border-amber-400/20 rounded-lg text-amber-200 text-sm hover:bg-amber-400/10 hover:border-amber-400/40 transition-all"
                >
                  {preset.character}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Chat Assistant */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-amber-400/20 flex flex-col h-[600px]">
          <div className="p-6 border-b border-amber-400/20">
            <h3 className="text-lg font-semibold text-amber-100 flex items-center gap-2">
              <MessageCircle size={20} className="text-amber-400" />
              AI Sprite Assistant
            </h3>
            <p className="text-amber-200/70 text-sm mt-1">Get help with your sprite creation</p>
          </div>

          {/* Chat History */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.map((msg, index) => renderChatMessage(msg, index))}
            
            {isChatLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-black" />
                </div>
                <div className="bg-black/30 text-amber-200 border border-amber-400/20 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-amber-400/20">
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={currentChatMessage}
                onChange={(e) => setCurrentChatMessage(e.target.value)}
                placeholder="Ask for sprite ideas, poses, styles..."
                className="flex-1 px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={!currentChatMessage.trim() || isChatLoading}
                className="px-4 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-black rounded-xl hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20 h-96 flex items-center justify-center">
            {isGenerating ? (
              <div className="text-center">
                <Loader2 size={48} className="animate-spin text-amber-400 mx-auto mb-4" />
                <p className="text-amber-200">Generating your sprite...</p>
                <p className="text-amber-400/70 text-sm mt-2">This may take a moment</p>
              </div>
            ) : generatedSprite ? (
              <div className="text-center">
                <img
                  src={`data:image/png;base64,${generatedSprite}`}
                  alt="Generated sprite"
                  className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                />
                <p className="text-amber-200 text-sm mt-4">Sprite generated successfully!</p>
              </div>
            ) : (
              <div className="text-center text-amber-400/50">
                <ImageIcon size={48} className="mx-auto mb-4" />
                <p>Your generated sprite will appear here</p>
              </div>
            )}
          </div>

          {/* Generation Tips */}
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
            <h3 className="text-lg font-medium text-amber-100 mb-4">Generation Tips</h3>
            <ul className="space-y-2 text-amber-200 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                Use the AI assistant to brainstorm character ideas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                Ask for specific pose suggestions for your character
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                Get style recommendations based on your game genre
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">•</span>
                Click suggestion buttons to auto-fill parameters
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpriteGenerator;