import React, { useState, useRef } from 'react';
import { Upload, X, Tag, User, Palette, FileImage, Loader2 } from 'lucide-react';

interface TrainingDataUploadProps {
  onUploadComplete: () => void;
}

const TrainingDataUpload: React.FC<TrainingDataUploadProps> = ({ onUploadComplete }) => {
  const [formData, setFormData] = useState({
    character: '',
    pose: '',
    styleTags: [] as string[],
    characterTags: [] as string[],
    prompt: ''
  });
  const [currentStyleTag, setCurrentStyleTag] = useState('');
  const [currentCharacterTag, setCurrentCharacterTag] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64.split(',')[1];
        setSelectedImage(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStyleTag = () => {
    if (currentStyleTag.trim() && !formData.styleTags.includes(currentStyleTag.trim())) {
      setFormData(prev => ({
        ...prev,
        styleTags: [...prev.styleTags, currentStyleTag.trim()]
      }));
      setCurrentStyleTag('');
    }
  };

  const addCharacterTag = () => {
    if (currentCharacterTag.trim() && !formData.characterTags.includes(currentCharacterTag.trim())) {
      setFormData(prev => ({
        ...prev,
        characterTags: [...prev.characterTags, currentCharacterTag.trim()]
      }));
      setCurrentCharacterTag('');
    }
  };

  const removeStyleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      styleTags: prev.styleTags.filter(t => t !== tag)
    }));
  };

  const removeCharacterTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      characterTags: prev.characterTags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !formData.character || formData.styleTags.length === 0) {
      setError('Please provide character name, image, and at least one style tag');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/training-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: formData.character,
          pose: formData.pose,
          style_tags: formData.styleTags,
          character_tags: formData.characterTags,
          image_base64: selectedImage,
          prompt: formData.prompt
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload training data');
      }

      // Reset form
      setFormData({
        character: '',
        pose: '',
        styleTags: [],
        characterTags: [],
        prompt: ''
      });
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/20">
        <h2 className="text-xl font-semibold text-amber-100 mb-6 flex items-center gap-2">
          <Upload size={20} className="text-amber-400" />
          Upload Training References
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-amber-200 text-sm font-medium mb-2">
              Reference Image *
            </label>
            <div className="border-2 border-dashed border-amber-400/30 rounded-xl p-6 text-center hover:border-amber-400/50 transition-all">
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={`data:image/png;base64,${selectedImage}`}
                    alt="Selected reference"
                    className="max-w-64 max-h-64 mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 bg-red-900/20 border border-red-400/20 rounded-lg text-red-300 hover:bg-red-900/30 transition-all"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <FileImage size={48} className="text-amber-400/50 mx-auto mb-4" />
                  <p className="text-amber-200 mb-2">Click to upload reference sprite</p>
                  <p className="text-amber-400/70 text-sm">PNG, JPG up to 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Character Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Character Name *
                </label>
                <input
                  type="text"
                  value={formData.character}
                  onChange={(e) => setFormData(prev => ({ ...prev, character: e.target.value }))}
                  placeholder="e.g., Warrior, Mage, Ren"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, pose: e.target.value }))}
                  placeholder="e.g., idle, attacking, casting"
                  className="w-full px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Generation Prompt
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe how to generate similar sprites..."
                  rows={3}
                  className="w-full px-4 py-3 bg-black/30 border border-amber-400/30 rounded-xl text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              {/* Style Tags */}
              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Style Tags *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentStyleTag}
                    onChange={(e) => setCurrentStyleTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStyleTag())}
                    placeholder="e.g., anime, pixel art, fantasy"
                    className="flex-1 px-3 py-2 bg-black/30 border border-amber-400/30 rounded-lg text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addStyleTag}
                    className="px-3 py-2 bg-amber-400/20 border border-amber-400/30 rounded-lg text-amber-200 hover:bg-amber-400/30 transition-all"
                  >
                    <Tag size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.styleTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-200 text-sm flex items-center gap-2"
                    >
                      <Palette size={12} />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeStyleTag(tag)}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Character Tags */}
              <div>
                <label className="block text-amber-200 text-sm font-medium mb-2">
                  Character Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentCharacterTag}
                    onChange={(e) => setCurrentCharacterTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCharacterTag())}
                    placeholder="e.g., warrior, female, armored"
                    className="flex-1 px-3 py-2 bg-black/30 border border-amber-400/30 rounded-lg text-amber-100 placeholder-amber-400/50 focus:outline-none focus:border-amber-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addCharacterTag}
                    className="px-3 py-2 bg-amber-400/20 border border-amber-400/30 rounded-lg text-amber-200 hover:bg-amber-400/30 transition-all"
                  >
                    <User size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.characterTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-400/20 border border-blue-400/30 rounded-full text-blue-200 text-sm flex items-center gap-2"
                    >
                      <User size={12} />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeCharacterTag(tag)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-400/20 rounded-xl">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || !selectedImage || !formData.character || formData.styleTags.length === 0}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold py-3 px-6 rounded-xl hover:from-amber-300 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30"
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload Training Data
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TrainingDataUpload;