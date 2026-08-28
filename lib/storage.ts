import "server-only";
import { HeadObjectCommand, PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.STORAGE_BUCKET || "boulde-media";
const client = new S3Client({ region: process.env.STORAGE_REGION || "us-east-1", endpoint: process.env.STORAGE_ENDPOINT || "http://127.0.0.1:9000", forcePathStyle: true, credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY || "boulde_local", secretAccessKey: process.env.STORAGE_SECRET_KEY || "boulde_local_password" } });

export function createUploadUrl(key: string, contentType: string) { return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 10 * 60 }); }
export function createReadUrl(key: string) { return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 15 * 60 }); }
export async function storedObjectExists(key: string, expectedSize: number) { const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return result.ContentLength === expectedSize; }
