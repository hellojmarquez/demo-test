// lib/minioClient.ts
import { Client, ClientOptions } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT as string,
  port: parseInt(process.env.MINIO_PORT || "9000", 10),
  useSSL: process.env.MINIO_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY as string,
  secretKey: process.env.MINIO_SECRET_KEY as string,
} as ClientOptions);

export default minioClient;
