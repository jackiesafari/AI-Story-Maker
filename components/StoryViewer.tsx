import React from 'react';
import { StoryPage } from '../types';
import { NarrationState } from '../App';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { SpeakerIcon, StopIcon, LoadingSpinnerIcon } from './icons/SpeakerIcon';

interface StoryViewerProps {
  pages: StoryPage[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onPlayNarration: (index: number) => void;
  narrationState?: NarrationState;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ pages, currentIndex, onNavigate, onPlayNarration, narrationState }) => {
  const currentPage = pages[currentIndex];

  if (!currentPage) return null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < pages.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };
  
  const imageSrc = `data:${currentPage.image.mimeType};base64,${currentPage.image.base64}`;

  const renderNarrationButton = () => {
    if (narrationState?.isLoading) {
      return <LoadingSpinnerIcon />;
    }
    if (narrationState?.isPlaying) {
      return <StopIcon />;
    }
    return <SpeakerIcon />;
  };

  return (
    <div className="w-full flex flex-col items-center mb-6">
      <div className="relative w-full max-w-2xl aspect-square bg-black/50 rounded-xl overflow-hidden shadow-lg border-2 border-amber-300/30 p-1">
        <img src={imageSrc} alt={`Story page ${currentIndex + 1}`} className="w-full h-full object-contain rounded-lg" />
        
        <div className="absolute top-2 right-2 bg-black/70 text-amber-50 text-sm px-3 py-1 rounded-full font-body">
            Page {currentIndex + 1} / {pages.length}
        </div>

        {currentIndex > 0 && (
          <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 rounded-full hover:bg-amber-900/60 transition-all duration-300 text-amber-200 hover:scale-110">
            <ChevronLeftIcon />
          </button>
        )}
        {currentIndex < pages.length - 1 && (
          <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 rounded-full hover:bg-amber-900/60 transition-all duration-300 text-amber-200 hover:scale-110">
            <ChevronRightIcon />
          </button>
        )}
      </div>

      {pages.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? 'bg-amber-400 scale-110'
                  : 'bg-amber-500/30 hover:bg-amber-500/60'
              }`}
              aria-label={`Go to page ${index + 1}`}
              aria-current={currentIndex === index ? 'page' : undefined}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl mt-4 p-5 bg-black/20 rounded-lg border border-amber-500/20 shadow-inner flex items-start gap-4">
        <button 
          onClick={() => onPlayNarration(currentIndex)} 
          className="p-2 bg-amber-900/30 rounded-full text-amber-200 hover:bg-amber-900/60 transition-colors disabled:opacity-50"
          aria-label={narrationState?.isPlaying ? "Stop narration" : "Play narration"}
          disabled={narrationState?.isLoading}
        >
          {renderNarrationButton()}
        </button>
        <p className="flex-1 text-amber-50 whitespace-pre-wrap leading-relaxed">{currentPage.text}</p>
      </div>
    </div>
  );
};

export default StoryViewer;
