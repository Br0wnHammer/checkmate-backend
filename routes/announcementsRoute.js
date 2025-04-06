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
			verifyJWT,
			isAllowed(["admin", "superadmin"]),
			this.announcementController.createAnnouncementHandler
		);

		/**
		 * @route   GET /:statusPageId
		 * @desc    Get announcements (paginated, filterable by query params)
		 * @access  Public
		 */
		this.router.get("/", this.announcementController.getAnnouncementsHandler);
	}

	getRouter() {
		return this.router;
	}
}

export default AnnouncementRoutes;
