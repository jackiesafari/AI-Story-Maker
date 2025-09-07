import React, { useState, useRef, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import StoryViewer from './components/StoryViewer';
import PromptInput from './components/PromptInput';
import Loader from './components/Loader';
import ExportStory from './components/ExportStory';
import { StoryPage } from './types';
import { generateStoryStart, generateNextPage } from './services/geminiService';
import { generateNarration } from './services/elevenLabsService';

export interface NarrationState {
  audioUrl?: string;
  isLoading: boolean;
  isPlaying: boolean;
}

const App: React.FC = () => {
  const [storyPages, setStoryPages] = useState<StoryPage[]>([]);
  const [storyStyle, setStoryStyle] = useState<string>('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrationState, setNarrationState] = useState<{ [pageIndex: number]: NarrationState }>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  // Stop audio when navigating away or when a new story starts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Reset all 'isPlaying' states
      const newNarrationState: { [pageIndex: number]: NarrationState } = {};
      Object.keys(narrationState).forEach(key => {
        const index = parseInt(key, 10);
        newNarrationState[index] = { ...narrationState[index], isPlaying: false };
      });
      setNarrationState(newNarrationState);
    }
  }, [currentPageIndex, storyPages.length]);


  const handleStartStory = async (prompt: string, imageFile: File | null) => {
    setIsLoading(true);
    setError(null);
    setNarrationState({}); // Clear previous narration
    try {
      const { pages: initialPages, style: initialStyle } = await generateStoryStart(prompt, imageFile);
      setStoryPages(initialPages);
      setStoryStyle(initialStyle);
      setCurrentPageIndex(0);
    } catch (e) {
      console.error(e);
      setError("The magic spell failed! The crystal ball is cloudy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueStory = async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const nextPage = await generateNextPage(storyPages, prompt, storyStyle);
      const updatedPages = [...storyPages, nextPage];
      setStoryPages(updatedPages);
      setCurrentPageIndex(updatedPages.length - 1);
    } catch (e) {
      console.error(e);
      setError("The magical ink has run dry! We couldn't write the next page. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = (index: number) => {
    setCurrentPageIndex(index);
  };
  
  const handlePlayNarration = async (pageIndex: number) => {
    const currentState = narrationState[pageIndex] ?? { isLoading: false, isPlaying: false };

    // Stop currently playing audio before starting a new one
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    // Reset all other pages' isPlaying state
    const resetState = { ...narrationState };
    Object.keys(resetState).forEach(key => {
        resetState[parseInt(key)].isPlaying = false;
    });

    if (currentState.isPlaying) {
      setNarrationState(prev => ({ ...prev, [pageIndex]: { ...currentState, isPlaying: false }}));
      return;
    }

    if (currentState.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = currentState.audioUrl;
        audioRef.current.play();
        setNarrationState({ ...resetState, [pageIndex]: { ...currentState, isPlaying: true }});
      }
      return;
    }
    
    if (currentState.isLoading) return;

    try {
      setNarrationState({ ...resetState, [pageIndex]: { ...currentState, isLoading: true }});
      const audioBlob = await generateNarration(storyPages[pageIndex].text);
      const audioUrl = URL.createObjectURL(audioBlob);

      setNarrationState(prev => ({ ...prev, [pageIndex]: { isLoading: false, audioUrl, isPlaying: true }}));
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (e) {
      console.error(e);
      setError("The storyteller's voice is lost! Could not generate narration.");
      setNarrationState(prev => ({ ...prev, [pageIndex]: { ...currentState, isLoading: false }}));
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    const onEnded = () => {
       setNarrationState(prev => {
        const newState = {...prev};
        if(newState[currentPageIndex]) {
            newState[currentPageIndex].isPlaying = false;
        }
        return newState;
      });
    };

    audioEl?.addEventListener('ended', onEnded);
    return () => {
      audioEl?.removeEventListener('ended', onEnded);
    };
  }, [currentPageIndex]);

  return (
    <div className="bg-slate-900 text-white min-h-screen font-body bg-cover bg-center bg-fixed" style={{backgroundImage: "url('/background.jpg')"}}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <header className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-amber-300 font-display tracking-wider [text-shadow:_2px_2px_8px_rgb(0_0_0_/_80%)]">
                AI Story Weaver
            </h1>
            <p className="text-amber-100/80 mt-2 max-w-2xl mx-auto">
                Craft enchanting tales with a spark of imagination and a touch of magic. Your words and pictures come to life!
            </p>
        </header>

        <main className="w-full flex flex-col items-center justify-center flex-grow relative">
          {isLoading && <Loader />}
          {!isLoading && error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center max-w-lg">
              <h3 className="font-bold">An Unexpected Twist!</h3>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && storyPages.length === 0 && (
            <ImageUploader onStart={handleStartStory} />
          )}
          
          {!isLoading && storyPages.length > 0 && (
            <>
              <StoryViewer 
                pages={storyPages} 
                currentIndex={currentPageIndex} 
                onNavigate={handleNavigate}
                onPlayNarration={handlePlayNarration}
                narrationState={narrationState[currentPageIndex]}
              />
              <div className="w-full max-w-2xl mt-2 flex flex-col items-center gap-4">
                 <PromptInput 
                    onSubmit={handleContinueStory}
                    buttonText="Continue Story"
                    placeholder="What happens next? e.g., The knight enters the cave..."
                  />
                  <ExportStory pages={storyPages} />
              </div>
            </>
          )}
        </main>
        
        <footer className="text-center mt-8 text-amber-500/60 text-sm">
            <p>Powered by Google Gemini & ElevenLabs</p>
        </footer>
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
};

export default App;
