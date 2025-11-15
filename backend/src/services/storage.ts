import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { Readable } from 'stream';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env.S3_BUCKET || 'flo-packages';

export const uploadAsset = async (
  file: Buffer,
  filename: string,
  contentType?: string
): Promise<{ storageKey: string; sha256: string; size: number }> => {
  const sha256 = crypto.createHash('sha256').update(file).digest('hex');
  const storageKey = `assets/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${filename}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      Body: file,
      ContentType: contentType,
      Metadata: {
        sha256,
      },
    })
  );

  return {
    storageKey,
    sha256,
    size: file.length,
  };
};

export const getAssetUrl = async (storageKey: string, expiresIn: number = 3600): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

export const getAssetMetadata = async (storageKey: string) => {
  const command = new HeadObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  });

  const response = await s3Client.send(command);
  return {
    size: response.ContentLength,
    contentType: response.ContentType,
    sha256: response.Metadata?.sha256,
  };
};

export const downloadAsset = async (storageKey: string): Promise<Buffer> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as Readable;
  
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  
  return Buffer.concat(chunks);
};

export default {
  uploadAsset,
  getAssetUrl,
  getAssetMetadata,
  downloadAsset,
};
