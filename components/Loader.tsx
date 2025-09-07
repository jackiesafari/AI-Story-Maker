import React from 'react';

const Loader: React.FC = () => {
  const messages = [
    "Brewing potions for the next page...",
    "Consulting the stars for your story...",
    "Waking the slumbering pixels...",
    "The friendly dragon is drawing your picture...",
    "Spinning words from moonbeams...",
    "Polishing the crystal ball...",
    "Asking the sprites for inspiration..."
  ];
  const [message, setMessage] = React.useState(messages[0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-3xl">
      <div className="w-16 h-16 border-4 border-t-amber-400 border-r-amber-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-amber-100">{message}</p>
    </div>
  );
};

export default Loader;