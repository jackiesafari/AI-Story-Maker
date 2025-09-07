import React, { useState } from 'react';
import { MagicWandIcon } from './icons/MagicWandIcon';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  buttonText?: string;
  placeholder?: string;
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, buttonText = "Generate", placeholder = "Enter your prompt..." }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSubmit(prompt);
    setPrompt('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-4">
      <div className="flex flex-col sm:flex-row gap-2 items-center bg-black/20 border border-amber-500/20 rounded-lg p-2 shadow-md">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="w-full flex-grow bg-transparent text-amber-50 placeholder:text-amber-100/40 p-2 rounded-md focus:outline-none resize-none"
          rows={2}
        />
        <button 
          type="submit" 
          disabled={!prompt.trim()}
          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 text-white font-semibold rounded-md shadow-lg shadow-amber-900/40 hover:shadow-xl hover:shadow-amber-800/60 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <MagicWandIcon />
          {buttonText}
        </button>
      </div>
    </form>
  );
};

export default PromptInput;