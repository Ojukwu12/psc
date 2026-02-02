import { randomUUID } from "crypto";
import AWS from "aws-sdk";
import env from "../../config/env.js";

function buildClient() {
  const config = {
    region: env.s3.region,
  };

  if (env.s3.endpoint) {
    config.endpoint = env.s3.endpoint;
  }

  if (env.s3.forcePathStyle) {
    config.s3ForcePathStyle = true;
  }

  if (env.s3.accessKeyId && env.s3.secretAccessKey) {
    config.accessKeyId = env.s3.accessKeyId;
    config.secretAccessKey = env.s3.secretAccessKey;
  }

  return new AWS.S3(config);
}

const client = buildClient();

export const s3Storage = {
  async upload({ buffer, mimeType, originalName }) {
    if (!env.s3.bucket) {
      throw new Error("S3_BUCKET is required for S3 storage");
    }

    const ext = originalName.includes(".") ? originalName.slice(originalName.lastIndexOf(".")) : ".pdf";
    const folder = new Date().toISOString().slice(0, 10);
    const key = `past-questions/${folder}/${randomUUID()}${ext}`;

    await client
      .putObject({
        Bucket: env.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType || "application/pdf",
      })
      .promise();

    return { key };
  },

  async getStream(key) {
    if (!env.s3.bucket) {
      throw new Error("S3_BUCKET is required for S3 storage");
    }

    const response = await client
      .getObject({
        Bucket: env.s3.bucket,
        Key: key,
      })
      .promise();

    return response.Body;
  },
};
