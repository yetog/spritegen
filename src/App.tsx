import React, { useState, useEffect } from 'react';
import { Sparkles, History, Upload, Brain, Menu, X, AlertCircle, RefreshCw } from 'lucide-react';
import SpriteGenerator from './components/SpriteGenerator';
import SpriteGallery from './components/SpriteGallery';
import TrainingDataUpload from './components/TrainingDataUpload';
import MCPInterface from './components/MCPInterface';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { Sprite } from './types/sprite';
import { fetchSprites, updateSpriteRating, saveSprite, checkBackendHealth } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery' | 'training' | 'mcp'>('generate');
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Check backend connectivity on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Load sprites from backend when component mounts or when switching to gallery
  useEffect(() => {
    if (activeTab === 'gallery') {
      loadSprites();
    }
  }, [activeTab]);

  const checkBackendConnection = async () => {
    try {
      const isHealthy = await checkBackendHealth();
      setBackendConnected(isHealthy);
      if (!isHealthy) {
        setError('Backend server is not responding. Please ensure the backend is running on http://localhost:5000');
      }
    } catch (err) {
      setBackendConnected(false);
      setError('Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000');
    }
  };

  const loadSprites = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedSprites = await fetchSprites({
        sortBy: 'created_at',
        sortOrder: 'DESC'
      });
      setSprites(fetchedSprites);
      setBackendConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sprites';
      setError(errorMessage);
      console.error('Error loading sprites:', err);
      
      // Check if it's a connection error
      if (errorMessage.includes('connect') || errorMessage.includes('fetch') || errorMessage.includes('backend')) {
        setBackendConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpriteGenerated = async (sprite: Sprite) => {
    try {
      // Save to backend
      await saveSprite(sprite);
      
      // Add to local state for immediate UI update
      setSprites(prev => [sprite, ...prev]);
      
      console.log('Sprite saved successfully:', sprite.id);
    } catch (err) {
      console.error('Error saving sprite:', err);
      setError(err instanceof Error ? err.message : 'Failed to save sprite');
      
      // Still add to local state even if backend save fails
      setSprites(prev => [sprite, ...prev]);
    }
  };

  const handleRatingChange = async (id: string, rating: number, feedback?: string) => {
    try {
      // Update backend
      await updateSpriteRating(id, rating, feedback);
      
      // Update local state
      setSprites(prev => 
        prev.map(sprite => 
          sprite.id === id 
            ? { ...sprite, rating, feedback, updatedAt: new Date().toISOString() }
            : sprite
        )
      );
      
      console.log('Sprite rating updated:', id, rating);
    } catch (err) {
      console.error('Error updating sprite rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to update rating');
    }
  };

  const handleTrainingUploadComplete = () => {
    // Refresh any relevant data or show success message
    console.log('Training data uploaded successfully');
  };

  const handleRetryConnection = () => {
    setError(null);
    checkBackendConnection();
    if (activeTab === 'gallery') {
      loadSprites();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-8">
          {/* Backend Connection Status */}
          {backendConnected === false && (
            <div className="mb-6">
              <div className="bg-amber-900/20 border border-amber-400/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-amber-300 font-medium mb-1">Backend Server Not Connected</h3>
                    <p className="text-amber-200/80 text-sm mb-3">
                      The backend server appears to be offline. Please ensure it's running on http://localhost:5000
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetryConnection}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                      </button>
                      <a
                        href="http://localhost:5000/health"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Test Backend
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-900/20 border border-red-400/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-300 text-sm">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="transition-all duration-500 ease-in-out">
            {activeTab === 'generate' && (
              <SpriteGenerator onSpriteGenerated={handleSpriteGenerated} />
            )}
            {activeTab === 'gallery' && (
              <SpriteGallery 
                sprites={sprites} 
                onRatingChange={handleRatingChange}
                loading={loading}
                onRefresh={loadSprites}
              />
            )}
            {activeTab === 'training' && (
              <TrainingDataUpload onUploadComplete={handleTrainingUploadComplete} />
            )}
            {activeTab === 'mcp' && (
              <MCPInterface />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;