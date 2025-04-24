import { Router } from "express";
import healthRoute from "routes/health.route";
import authRoute from "routes/auth.route";
import notificationRouter from "routes/notification.route";
import pageRoutes from "routes/page.route";
import assetUploadRouter from "routes/asset-upload.routes";
import parentRouter from "routes/parent.routes";
import documentProcessRouter from "routes/document-process.routes";

const apiRouter = Router();
const pageRouter = Router();

apiRouter.use('/health', healthRoute);
apiRouter.use('/auth', authRoute);
apiRouter.use('/asset', assetUploadRouter);
apiRouter.use('/parent', parentRouter);
apiRouter.use('/registration', documentProcessRouter);

pageRouter.use("/notification", notificationRouter);

// Add page routes directly to the page router
pageRouter.use("/", pageRoutes);

export default {
    apiRoutes: apiRouter,
    pageRoutes: pageRouter
};