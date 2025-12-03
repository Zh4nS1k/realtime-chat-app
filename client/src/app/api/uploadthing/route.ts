import { createRouteHandler } from "uploadthing/next";
import { chatFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: chatFileRouter,
});
