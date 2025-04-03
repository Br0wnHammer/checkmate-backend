import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { isAllowed } from "../middleware/isAllowed.js";

class AnnouncementRoutes {
    constructor(controller) {
        this.router = Router();
        this.announcementController = controller;
        this.initRoutes();
    }

    initRoutes() {
        /**
         * @route   POST /
         * @desc    Create a new announcement
         * @access  Private (Requires JWT verification)
         */
        this.router.post(
            "/",
            isAllowed(["admin", "superadmin"]),
            verifyJWT,
            this.announcementController.createAnnouncementHandler
        );
    }

    getRouter() {
        return this.router;
    }
}

export default AnnouncementRoutes;