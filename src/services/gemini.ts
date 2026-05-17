import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// --- Constants and Types ---
const GEMINI_API_KEY_ERROR_MESSAGE = "Gemini API key is not configured. Please set it using the 'AetherCode: Set Gemini API Key' command.";

interface GenerationConfig {
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  responseMimeType?: string; // Added for JSON generation
}

const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 8192,
};

// Interface for Google API model response structure
interface GeminiModelData {
  name: string;
  supportedGenerationMethods: string[];
}

interface GeminiModelsApiResponse {
  models: GeminiModelData[];
}

export class GeminiService {
  private _genAI: GoogleGenerativeAI | null = null; // Private instance of the client
  private _model: GenerativeModel | null = null;
  private _apiKey: string | null = null;
  private _currentModelName: string | null = null; // To track the current active model

  constructor(apiKey: string) {
    this.updateApiKey(apiKey);
  }

  /**
   * Updates the API key and re-initializes the Gemini client and model.
   * Throws an error if the API key is invalid.
   */
  public updateApiKey(apiKey: string): void {
    if (!apiKey) {
      this._apiKey = null;
      this._genAI = null;
      this._model = null;
      this._currentModelName = null;
      // Original code returned early. Let subsequent calls throw if model is null.
      return; 
    }
    
    if (this._apiKey === apiKey && this._genAI && this._model) {
        // No change, no need to re-initialize if already configured
        return;
    }

    this._apiKey = apiKey;
    this._genAI = new GoogleGenerativeAI(apiKey);
    // Initialize with the default model
    this._createGenerativeModel("gemini-2.5-flash"); // Use helper for initial model setup
  }

  private _createGenerativeModel(modelName: string, config?: GenerationConfig): void {
    if (!this._genAI || !this._apiKey) {
      throw new Error(GEMINI_API_KEY_ERROR_MESSAGE);
    }
    this._model = this._genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { ...DEFAULT_GENERATION_CONFIG, ...config },
    });
    this._currentModelName = modelName;
  }

  /**
   * Fetches available models from the Gemini API and selects the best fallback model.
   * @returns The name of the best available model, or null if none found.
   */
  private async _fetchAndSelectFallbackModel(): Promise<string | null> {
    if (!this._apiKey) {
      console.warn("GeminiService: Cannot fetch fallback models: API key is not set.");
      return null;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this._apiKey}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`);
      }
      const data = await res.json() as GeminiModelsApiResponse;

      if (data?.models?.length) {
        const validModels = data.models
          .filter((m: GeminiModelData) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: GeminiModelData) => m.name.replace('models/', ''));

        if (validModels.length > 0) {
          const preferredOrder = [
            'gemini-2.5-flash', 'gemini-2.5-pro',
            'gemini-1.5-flash', 'gemini-1.5-pro',
            'gemini-pro', // Fallback to older generation if newer unavailable
          ];

          // Find the highest-priority model that is also valid
          let bestModel = preferredOrder.find(p => validModels.includes(p)) || validModels[0];
          
          if (bestModel !== this._currentModelName) { // Only re-initialize if model actually changes
            this._createGenerativeModel(bestModel);
            console.log(`GeminiService: Fallback to model "${bestModel}"`);
          }
          return bestModel;
        }
      }
    } catch (e: any) {
      console.error("GeminiService: Auto-fallback failed:", e.message);
    }
    return null;
  }

  /**
   * Generic handler for making Gemini API requests with 404 fallback logic.
   * @param requestFn A function that performs the actual Gemini API request.
   * @param fallbackConfig Optional generation config for the fallback request.
   * @returns The result of the request function.
   */
  private async _handleGeminiRequest<T>( 
    requestFn: (model: GenerativeModel) => Promise<T>,
    fallbackConfig?: GenerationConfig
  ): Promise<T> {
    if (!this._model) {
      throw new Error(GEMINI_API_KEY_ERROR_MESSAGE);
    }

    try {
      return await requestFn(this._model);
    } catch (error: any) {
      if (error.message?.includes('404')) {
        console.warn(`GeminiService: Model '${this._currentModelName}' not found (404). Attempting fallback...`);
        const fallbackModelName = await this._fetchAndSelectFallbackModel();
        if (fallbackModelName) {
          try {
            // Re-create model with fallback config if provided for specific scenarios (like JSON)
            this._createGenerativeModel(fallbackModelName, fallbackConfig); 
            return await requestFn(this._model!); // Retry with the new model
          } catch (retryError: any) {
            throw new Error(`GeminiService: Fallback model '${fallbackModelName}' failed: ${retryError.message}`);
          }
        }
      }
      throw error; // Re-throw original or fallback error
    }
  }

  private _constructPrompt(userPrompt: string, systemPrompt?: string, isJsonRequest: boolean = false): string {
    let finalPrompt = '';
    if (systemPrompt) {
      finalPrompt += `${systemPrompt}\n\n`;
    }
    if (isJsonRequest) {
      finalPrompt += 'Return ONLY valid JSON. No explanations.\n\nTask: ';
    }
    finalPrompt += userPrompt;
    return finalPrompt;
  }

  /**
   * Generates content in a streaming fashion from the Gemini model.
   * Supports an optional system prompt.
   */
  async *generateStream(prompt: string, systemPrompt?: string): AsyncGenerator<string> {
    const fullPrompt = this._constructPrompt(prompt, systemPrompt);

    const streamRequest = async (model: GenerativeModel) => {
      const result = await model.generateContentStream(fullPrompt);
      return result.stream;
    };

    const streamResult = await this._handleGeminiRequest(streamRequest);

    for await (const chunk of streamResult) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  /**
   * Generates JSON content from the Gemini model.
   * The model is configured to respond with application/json MIME type.
   */
  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const fullPrompt = this._constructPrompt(prompt, systemPrompt, true);

    const jsonRequest = async (model: GenerativeModel) => {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const text = result.response.text();
      return JSON.parse(text) as T;
    };
    
    // Pass the JSON generation config to ensure fallback also uses it
    const jsonFallbackConfig: GenerationConfig = { 
        ...DEFAULT_GENERATION_CONFIG, 
        responseMimeType: "application/json" 
    };

    return this._handleGeminiRequest(jsonRequest, jsonFallbackConfig);
  }
}