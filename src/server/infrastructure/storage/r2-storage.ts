import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ObjectStorage } from "@/server/application/contracts/services/object-storage";

class R2Storage implements ObjectStorage {
  async upload(input: {
    body: Uint8Array;
    contentType: string;
    filename: string;
  }): Promise<string> {
    const endpointOverride = process.env.S3_ENDPOINT?.replace(/\/$/, "");
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (
      !accessKeyId ||
      !secretAccessKey ||
      !bucket ||
      !publicUrl ||
      (!endpointOverride && !accountId)
    ) {
      throw new Error("Armazenamento de imagens não configurado.");
    }

    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE
      ? process.env.S3_FORCE_PATH_STYLE === "true"
      : Boolean(endpointOverride);

    const client = new S3Client({
      region: endpointOverride ? process.env.S3_REGION || "us-east-1" : "auto",
      endpoint: endpointOverride || `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle,
    });
    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
    const key = `uploads/${crypto.randomUUID()}-${safeName}`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return `${publicUrl}/${key}`;
  }
}

export { R2Storage };
