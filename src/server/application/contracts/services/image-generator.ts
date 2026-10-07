type GeneratedImage = {
  bytes: Uint8Array;
  contentType: string;
};

type ImageGenerationRequest = {
  prompt: string;
  personImageUrl: string;
  inspirationImageUrl: string | null;
};

interface ImageGenerator {
  isConfigured(): boolean;
  generate(request: ImageGenerationRequest): Promise<GeneratedImage>;
}

export type { GeneratedImage, ImageGenerationRequest, ImageGenerator };
