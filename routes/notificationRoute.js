import express from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";

class NotificationRoutes {
    constructor(notificationController) {
        this.notificationController = notificationController;
        this.router = express.Router();
        this.publicRouter = express.Router(); 
        this.initializeRoutes();
    }

    initializeRoutes() {
        // Protected routes 
        this.router.post(
            "/trigger",
            verifyJWT,
            this.notificationController.triggerNotification
        );

        // Public routes 
        this.publicRouter.post(
            "/test-webhook",
            this.notificationController.testWebhook
        );
    }

    getRouter() {
        return this.router;
    }

    getPublicRouter() {
        return this.publicRouter;
    }
}

export default NotificationRoutes;
