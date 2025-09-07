import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { StoryPage } from '../types';

// Per guidelines, API key must be from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * Converts a File object to a GoogleGenAI.Part object.
 * @param file The file to convert.
 * @returns A promise that resolves to a Part object.
 */
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const storyPageSchema = {
  type: Type.OBJECT,
  properties: {
    storyText: {
      type: Type.STRING,
      description: "A paragraph of the story continuing from the prompt. It should be engaging for all ages. Maximum 100 words."
    },
    imagePrompt: {
      type: Type.STRING,
      description: "A short, descriptive, and vivid prompt for an image generation model to create an illustration for this part of the story. Focus on characters, setting, and action. Do NOT include style descriptions like 'storybook style' as that will be added later."
    }
  },
  required: ["storyText", "imagePrompt"]
};

/**
 * Generates an image using the Imagen model.
 * @param prompt The text prompt for image generation.
 * @returns A promise that resolves to an object with base64 image data and mimeType.
 */
const generateImage = async (prompt: string): Promise<{ base64: string; mimeType: string; }> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt, // The detailed style is now part of the prompt itself.
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (!response.generatedImages?.[0]?.image?.imageBytes) {
      throw new Error("Image generation failed or returned no data.");
  }

  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  return { base64: base64ImageBytes, mimeType: 'image/jpeg' };
};

/**
 * Generates story text and a base image prompt using the Gemini model.
 * @param systemInstruction The system instruction for the model.
 * @param parts The content parts for the prompt.
 * @returns A promise that resolves to the story text and a base image prompt.
 */
const generateStoryContentForFirstPage = async (systemInstruction: string, parts: any[]): Promise<{ storyText: string, imagePrompt: string }> => {
  const result: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: storyPageSchema,
      temperature: 0.8,
    },
  });

  const jsonString = result.text.trim();
  if (!jsonString) {
    throw new Error("Received an empty response from the AI.");
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    return { storyText: parsed.storyText, imagePrompt: parsed.imagePrompt };
  } catch(e) {
    console.error("Failed to parse JSON response:", jsonString);
    throw new Error("Received a malformed response from the AI.");
  }
};

/**
 * Generates the first three pages of a story with a consistent art style.
 * @param prompt The user's initial text prompt.
 * @param imageFile An optional initial image file.
 * @returns A promise that resolves to the first three StoryPages and the consistent style prompt.
 */
export const generateStoryStart = async (prompt: string, imageFile: File | null): Promise<{ pages: StoryPage[], style: string }> => {
    // --- MASTER STYLE CREATION ---
    const styleGenPrompt = `Based on the user's idea: "${prompt}", create a short "master prompt" suffix that defines the main character(s) and a consistent, magical art style for a children's storybook. For example: ", featuring a brave little squirrel with a tiny acorn helmet, in a soft, warm watercolor illustration style."`;
    const styleResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: styleGenPrompt,
        config: { temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } }
    });
    const masterStyle = styleResult.text.trim();
    if (!masterStyle) {
        throw new Error("The AI couldn't decide on an art style. Please try a different prompt.");
    }

    let page1: StoryPage;

    if (imageFile) {
        // --- PAGE 1 FROM IMAGE + TEXT ---
        const systemInstructionPage1 = "You are a master storyteller, creating an illustrated children's book. Your task is to write the **beginning** of a three-part short story based on the user's idea, along with a corresponding image prompt. Establish the characters and setting in a magical, adventurous tone.";
        const textPrompt = `Start a story based on this image and prompt: "${prompt}"`;
        const imagePart = await fileToGenerativePart(imageFile);
        const parts: any[] = [imagePart, { text: textPrompt }];

        const { storyText: text1, imagePrompt: baseImgPrompt1 } = await generateStoryContentForFirstPage(systemInstructionPage1, parts);
        const image1 = await generateImage(baseImgPrompt1 + masterStyle);
        page1 = { text: text1, image: image1 };
    } else {
        // --- PAGE 1 FROM TEXT ONLY (New, more robust logic) ---
        if (!prompt) {
            throw new Error("A story prompt is required to begin.");
        }
        // 1. Generate image directly from the user's prompt + master style.
        const image1 = await generateImage(prompt + masterStyle);

        // 2. Generate story text based on the generated image and user's original prompt.
        const systemInstructionForText = "You are a master storyteller. Based on the user's idea and the provided image (which illustrates that idea), write the **beginning** paragraph of a magical children's story. The story should be suitable for all ages and match the scene in the image.";
        const textGenPrompt = `The user's original idea was: "${prompt}"`;
        const imagePart = { inlineData: { data: image1.base64, mimeType: image1.mimeType } };
        
        const textResult = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: textGenPrompt }] },
            config: {
                systemInstruction: systemInstructionForText,
                temperature: 0.8,
            }
        });
        
        const text1 = textResult.text.trim();
        if (!text1) {
            throw new Error("The AI failed to write the story for the first page.");
        }
        page1 = { text: text1, image: image1 };
    }


    // --- PAGE 2 & 3: THE MIDDLE & END (Generated by editing Page 1) ---
    const page2 = await generateNextPage(
      [page1], 
      "Continue the story with a heartwarming middle part. Introduce a gentle, positive challenge or a moment of discovery.",
      masterStyle
    );

    const page3 = await generateNextPage(
      [page1, page2], 
      "Conclude this short story with a sweet and happy ending, resolving any challenges and leaving a warm feeling.",
      masterStyle
    );

    return { pages: [page1, page2, page3], style: masterStyle };
};


/**
 * Generates the next page of an ongoing story by EDITING the previous image.
 * @param history The existing pages of the story.
 * @param newPrompt The user's prompt for the next page.
 * @param masterStyle The consistent style prompt to guide the AI's writing and editing.
 * @returns A promise that resolves to the next StoryPage.
 */
export const generateNextPage = async (history: StoryPage[], newPrompt: string, masterStyle: string): Promise<StoryPage> => {
  const previousPage = history[history.length - 1];
  const storySoFar = history.map((page, index) => `Page ${index + 1}: ${page.text}`).join('\n\n');

  // Updated prompt to be more explicit and directive.
  const fullPrompt = `You are an author and illustrator for a children's storybook. The defined art style is: "${masterStyle}".

Here is the story so far:
${storySoFar}

Your task is to create the very next page based on this user instruction: "${newPrompt}".

Follow these two steps precisely:
1.  **Write a new story paragraph:** This paragraph should continue the story based on the user's instruction. It must be self-contained for this page.
2.  **Edit the input image:** Modify the image to create a new illustration that visually represents the story paragraph you just wrote. The change should be clear and magical.

You MUST output both the text and the new image.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: previousPage.image.base64,
            mimeType: previousPage.image.mimeType,
          },
        },
        { text: fullPrompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
      temperature: 0.7,
    },
  });
  
  // Add a guard clause for safety blocks or malformed responses.
  if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
    console.error("Invalid response structure from AI, possibly due to a safety block:", JSON.stringify(response, null, 2));
    throw new Error("The AI was unable to continue the story. This might be due to a content filter. Please try a different prompt.");
  }

  let newText: string | null = null;
  let newImage: { base64: string, mimeType: string } | null = null;

  // The model returns multiple parts, we need to find the text and the image
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      newText = part.text;
    } else if (part.inlineData) {
      newImage = {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }

  if (!newText || !newImage) {
    console.error("Incomplete response from AI:", JSON.stringify(response, null, 2));
    throw new Error("The AI failed to generate a complete story page (text or image missing). Please try again.");
  }

  return { text: newText, image: newImage };
};