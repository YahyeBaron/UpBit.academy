import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

// Mount the UploadThing route handler at /api/uploadthing
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
