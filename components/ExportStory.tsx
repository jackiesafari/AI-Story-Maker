import React, { useState } from 'react';
import { StoryPage } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface ExportStoryProps {
  pages: StoryPage[];
}

const ExportStory: React.FC<ExportStoryProps> = ({ pages }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const generateHtmlContent = () => {
    const title = "My AI Story";
    const storyPagesHtml = pages.map((page, index) => `
      <div class="page">
        <img src="data:${page.image.mimeType};base64,${page.image.base64}" alt="Story Page ${index + 1}" />
        <p>${page.text.replace(/\n/g, '<br>')}</p>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap');
          body { 
            font-family: 'Lora', serif;
            background-color: #fdf6e3;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: auto;
          }
          h1 {
            text-align: center;
            color: #8b4513;
            border-bottom: 2px solid #d2b48c;
            padding-bottom: 10px;
          }
          .page {
            margin-bottom: 40px;
            text-align: center;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            border: 5px solid #d2b48c;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          p {
            margin-top: 15px;
            font-size: 1.1em;
            line-height: 1.6;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          ${storyPagesHtml}
        </div>
      </body>
      </html>
    `;
  };

  const handleExportHtml = () => {
    setIsExporting(true);
    setExportMessage('Generating HTML...');
    const htmlContent = generateHtmlContent();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ai-storybook.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMenuOpen(false);
    setIsExporting(false);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportMessage('Generating PDF...');
    setIsMenuOpen(false);
    
    // jsPDF is loaded from CDN in index.html
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxTextWidth = pageWidth - margin * 2;

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (i > 0) doc.addPage();

        const imageSrc = `data:${page.image.mimeType};base64,${page.image.base64}`;
        
        try {
            const img = new Image();
            img.src = imageSrc;
            await new Promise(resolve => { img.onload = resolve; });

            const aspectRatio = img.width / img.height;
            let pdfImgWidth = pageWidth - margin * 2;
            let pdfImgHeight = pdfImgWidth / aspectRatio;
            
            // Ensure image doesn't overflow page height
            if (pdfImgHeight > 150) {
              pdfImgHeight = 150;
              pdfImgWidth = pdfImgHeight * aspectRatio;
            }
            
            const imageX = (pageWidth - pdfImgWidth) / 2;
            doc.addImage(imageSrc, page.image.mimeType.split('/')[1].toUpperCase(), imageX, margin, pdfImgWidth, pdfImgHeight);

            const textY = margin + pdfImgHeight + 10;
            const textLines = doc.splitTextToSize(page.text, maxTextWidth);
            doc.text(textLines, margin, textY);

        } catch (error) {
            console.error("Error processing image for PDF:", error);
            doc.text("Error loading image for this page.", margin, margin);
        }
    }
    
    doc.save('ai-storybook.pdf');
    setIsExporting(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 border border-amber-500/50 bg-black/30 text-amber-200 font-semibold rounded-lg hover:bg-amber-900/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-wait"
        >
          {isExporting ? exportMessage : 'Export Story'}
          <DownloadIcon />
        </button>
      </div>

      {isMenuOpen && (
        <div className="origin-bottom-right absolute right-0 bottom-12 mb-2 w-56 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <a href="#" onClick={(e) => { e.preventDefault(); handleExportHtml(); }} className="block px-4 py-2 text-sm text-amber-100 hover:bg-amber-900/50" role="menuitem">Download as HTML</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleExportPdf(); }} className="block px-4 py-2 text-sm text-amber-100 hover:bg-amber-900/50" role="menuitem">Download as PDF</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportStory;