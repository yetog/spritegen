import React, { useState } from 'react';
import { Search, Filter, Star, Calendar, User, Palette, RefreshCw, Trash2 } from 'lucide-react';
import { Sprite } from '../types/sprite';
import StarRating from './StarRating';
import { deleteSprite } from '../services/api';

interface SpriteGalleryProps {
  sprites: Sprite[];
  onRatingChange: (id: string, rating: number, feedback?: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

const SpriteGallery: React.FC<SpriteGalleryProps> = ({ 
  sprites, 
  onRatingChange, 
  loading = false,
  onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSprite = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sprite?')) return;
    
    setDeletingId(id);
    try {
      await deleteSprite(id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting sprite:', error);
      alert('Failed to delete sprite. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSprites = sprites
    .filter(sprite => {
      const matchesSearch = sprite.character.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (sprite.pose && sprite.pose.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (sprite.style && sprite.style.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRating = filterRating === null || sprite.rating === filterRating;
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-12 border border-amber-400/20 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-amber-100 mb-2">Loading Sprites</h3>
          <p className="text-amber-200/70">Fetching your sprite collection...</p>
        </div>
      </div>
    );
  }

  if (sprites.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-12 border border-amber-400/20 text-center">
          <Palette size={64} className="text-amber-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-amber-100 mb-2">No Sprites Yet</h3>
          <p className="text-amber-200/70">Generate your first sprite to see it here!</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-4 py-2 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/30 rounded-lg text-amber-200 transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search and Filter Bar */}
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-3 text-amber-400/50" />
            <input
              type="text"
              placeholder="Search sprites by character, pose, or style..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'rating')}
              className="px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rated</option>
            </select>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 hover:bg-amber-400/10 hover:border-amber-400/40 transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 rounded-lg">
              <Palette size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-100 font-semibold text-lg">{sprites.length}</p>
              <p className="text-amber-200/70 text-sm">Total Sprites</p>
            </div>
          </div>
        </div>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 rounded-lg">
              <Star size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-100 font-semibold text-lg">
                {sprites.filter(s => s.rating > 0).length}
              </p>
              <p className="text-amber-200/70 text-sm">Rated</p>
            </div>
          </div>
        </div>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/20 rounded-lg">
              <User size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-100 font-semibold text-lg">
                {new Set(sprites.map(s => s.character)).size}
              </p>
              <p className="text-amber-200/70 text-sm">Characters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sprites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSprites.map((sprite) => (
          <div
            key={sprite.id}
            className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300 group relative"
          >
            {/* Delete Button */}
            <button
              onClick={() => handleDeleteSprite(sprite.id)}
              disabled={deletingId === sprite.id}
              className="absolute top-4 right-4 p-2 bg-red-900/20 hover:bg-red-900/40 border border-red-400/20 hover:border-red-400/40 rounded-lg text-red-400 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
              title="Delete sprite"
            >
              {deletingId === sprite.id ? (
                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
              ) : (
                <Trash2 size={16} />
              )}
            </button>

            <div className="aspect-square bg-black/30 rounded-xl mb-4 overflow-hidden">
              <img
                src={`data:image/png;base64,${sprite.imageBase64}`}
                alt={`${sprite.character} sprite`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-amber-100">{sprite.character}</h3>
                <p className="text-amber-200/70 text-sm">
                  {sprite.pose && `${sprite.pose} • `}{sprite.style}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-400/50" />
                <span className="text-amber-200/50 text-xs">
                  {new Date(sprite.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <StarRating
                rating={sprite.rating}
                onRatingChange={(rating) => onRatingChange(sprite.id, rating)}
              />
              
              {sprite.feedback && (
                <div className="mt-3 p-3 bg-black/30 rounded-lg">
                  <p className="text-amber-200/70 text-sm">{sprite.feedback}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredSprites.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search size={48} className="text-amber-400/50 mx-auto mb-4" />
          <p className="text-amber-200/70">No sprites found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default SpriteGallery;