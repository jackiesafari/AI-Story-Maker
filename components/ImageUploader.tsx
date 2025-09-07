import React, { useState, useRef } from 'react';
import { MagicWandIcon } from './icons/MagicWandIcon';

interface ImageUploaderProps {
  onStart: (prompt: string, imageFile: File | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onStart }) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('The magic scroll is too heavy! Please use an image under 4MB.');
        return;
      }
      setError(null);
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !imageFile) {
      setError('Every story needs a beginning! Please add an image or write the first line.');
      return;
    }
    setError(null);
    onStart(prompt, imageFile);
  };

  return (
    <div className="w-full max-w-lg text-center p-6 bg-black/20 rounded-xl border border-amber-500/20">
      <h2 className="text-3xl font-semibold mb-4 text-amber-100 font-display">Begin Your Tale</h2>
      <p className="text-amber-100/70 mb-6">Choose an image, write the first line, or both to start your magical adventure.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div 
          className="w-full h-64 border-2 border-dashed border-amber-400/40 rounded-lg flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-black/20 transition-all duration-300"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/webp"
            className="hidden" 
          />
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
          ) : (
            <div className="text-amber-200/60">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="mt-2 font-semibold">Choose a scene to begin</p>
              <p className="text-xs mt-1">(PNG, JPG, WEBP up to 4MB)</p>
            </div>
          )}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A brave knight discovers a mysterious, glowing cave..."
          className="w-full bg-black/30 border border-amber-500/30 rounded-lg p-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-shadow outline-none resize-none text-amber-50 placeholder:text-amber-100/40"
          rows={3}
        />
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <button 
          type="submit" 
          disabled={!prompt.trim() && !imageFile}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-amber-900/40 hover:shadow-xl hover:shadow-amber-800/60 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <MagicWandIcon />
          Start Story
        </button>
      </form>
    </div>
  );
};

export default ImageUploader;