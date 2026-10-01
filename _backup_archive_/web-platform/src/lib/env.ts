import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_CAMPUS_MODEL_URL: z.string().default("/models/campus.glb"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    if (process.env.NODE_ENV === "production") {
      const missing = parsed.error.issues
        .map((i) => i.path.join("."))
        .join(", ");
      throw new Error(`Invalid environment variables: ${missing}`);
    }
    return {
      MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017/campusguide",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-secret-minimum-32-characters-long",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "dev",
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "dev",
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "dev",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_CAMPUS_MODEL_URL: process.env.NEXT_PUBLIC_CAMPUS_MODEL_URL ?? "/models/campus.glb",
    };
  }

  return parsed.data;
}

export const env = getEnv();
