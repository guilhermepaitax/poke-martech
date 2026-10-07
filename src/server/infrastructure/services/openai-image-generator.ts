import OpenAI, { toFile } from "openai";
import type {
  GeneratedImage,
  ImageGenerationRequest,
  ImageGenerator,
} from "@/server/application/contracts/services/image-generator";
import { downloadImage } from "@/server/infrastructure/services/remote-image";

const DEFAULT_MODEL = "gpt-image-2";
const IMAGE_SIZE = "1360x800";
const QUALITIES = ["low", "medium", "high"] as const;

type ImageQuality = (typeof QUALITIES)[number];

class OpenAiImageGenerator implements ImageGenerator {
  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async generate(request: ImageGenerationRequest): Promise<GeneratedImage> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const references = request.inspirationImageUrl
      ? [request.inspirationImageUrl, request.personImageUrl]
      : [request.personImageUrl];
    const images = await Promise.all(references.map(imageFile));
    const result = await client.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL,
      image: images,
      prompt: request.inspirationImageUrl ? inspiredPrompt(request.prompt) : originalPrompt(request.prompt),
      size: IMAGE_SIZE,
      quality: imageQuality(),
      output_format: "jpeg",
      output_compression: 85,
      n: 1,
    });
    const encoded = result.data?.[0]?.b64_json;
    if (!encoded) throw new Error("O gerador de imagens não retornou nenhuma imagem.");
    return { bytes: new Uint8Array(Buffer.from(encoded, "base64")), contentType: "image/jpeg" };
  }
}

async function imageFile(url: string) {
  const image = await downloadImage(url);
  const extension = image.contentType === "image/png" ? "png" : image.contentType === "image/webp" ? "webp" : "jpg";
  return toFile(image.bytes, `referencia.${extension}`, { type: image.contentType });
}

function imageQuality(): ImageQuality {
  const configured = process.env.OPENAI_IMAGE_QUALITY;
  return QUALITIES.find((quality) => quality === configured) ?? "high";
}

function inspiredPrompt(prompt: string) {
  return [
    "Edit the first image, an official Pokémon trading card illustration.",
    "Keep it almost unchanged: the same Pokémon species, anatomy, body proportions, colors, eyes, pose and silhouette,",
    "the same background scenery, composition, camera angle and color palette,",
    "and the same art style, line work and shading.",
    "The second image is a photo of a real person. Add only a few of that person's recognizable traits to the Pokémon as small stylized details, such as hairstyle or baldness, glasses, facial hair, headphones or clothing colors.",
    "The result must still be the Pokémon from the first image, never a human.",
    prompt,
    "No text, no letters, no logos, no card frame, no borders.",
  ].join(" ");
}

function originalPrompt(prompt: string) {
  return [
    "Turn the person in the image into an original Pokémon-like creature for a trading card illustration. The result must be a creature, never a human.",
    "Use bold clean outlines, flat cel shading, vibrant colors and a detailed scenic natural background, in a wide landscape composition with the creature centered.",
    "Keep a few recognizable traits of the person as stylized creature features, such as hairstyle or baldness, glasses, facial hair, accessories and clothing colors.",
    prompt,
    "No text, no letters, no logos, no card frame, no borders.",
  ].join(" ");
}

export { OpenAiImageGenerator };
