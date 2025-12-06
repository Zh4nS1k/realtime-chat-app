import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuthFromRequest } from "@/lib/auth";

const f = createUploadthing();

export const chatFileRouter = {
  chatUpload: f({ blob: { maxFileSize: "16MB" } })
    .middleware(async ({ req }) => {
      const auth = await getAuthFromRequest(req);
      return { userId: auth?.user?._id?.toString() ?? "anonymous" };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      return { url: file.url, uploadedBy: metadata.userId, name: file.name, type: file.type };
    }),
} satisfies FileRouter;

export type ChatFileRouter = typeof chatFileRouter;
