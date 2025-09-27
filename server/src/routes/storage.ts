import type { FastifyInstance } from 'fastify';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function registerStorageRoutes(app: FastifyInstance) {
  const accountId = process.env.R2_ACCOUNT_ID as string;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const r2 = new S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    }
  });

  function getBucket(): string {
    const envBucket = process.env.R2_BUCKET as string | undefined;
    if (envBucket) return envBucket;
    const api = process.env.R2_S3_API as string | undefined;
    if (api) {
      const parts = api.split('/');
      return parts[parts.length - 1] || 'knhev';
    }
    return 'knhev';
  }

  app.post('/trpc/storage.presign', async (req, reply) => {
    try {
      if (!(app as any).ensureAuth?.(req, reply)) return;
      const input = (req.body as any)?.input || {};
      const bucket = getBucket();
      const key = input.key || `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const contentType = input.contentType || 'application/octet-stream';
      const expires = Math.min(Math.max(input.expiresSeconds ?? 300, 60), 3600);
      const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: expires });
      const publicBase = (process.env.R2_CUSTOM_DOMAIN || process.env.R2_PUBLIC_DEV_URL || '').replace(/\/$/, '');
      const publicUrl = publicBase ? `${publicBase}/${key}` : null;
      const expiresAt = new Date(Date.now() + expires * 1000).toISOString();
      reply.send({ uploadUrl, publicUrl, key, contentType, expiresAt });
    } catch (e: any) { reply.code(500).send({ error: e?.message || 'error' }); }
  });
}


