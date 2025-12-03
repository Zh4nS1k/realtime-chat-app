import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuthFromRequest } from "@/lib/auth";

const f = createUploadthing();

export const chatFileRouter = {
  chatImage: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const auth = await getAuthFromRequest(req);
      return { userId: auth?.user?._id?.toString() ?? "anonymous" };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      return { url: file.url, uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type ChatFileRouter = typeof chatFileRouter;
