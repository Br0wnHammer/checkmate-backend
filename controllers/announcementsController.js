import { handleError } from "./controllerUtils.js";

const SERVICE_NAME = "announcementController";

/**
 * Controller for managing announcements in the system.
 * This class handles the creation of new announcements.
 *
 * @class AnnouncementController
 */

class AnnouncementController {
	constructor(db, stringService) {
		this.db = db;
		this.stringService = stringService;
		this.createAnnouncementHandler = this.createAnnouncementHandler.bind(this);
		this.getAnnouncementsHandler = this.getAnnouncementsHandler.bind(this);
	}

	/**
	 * Handles the creation of a new announcement.
	 *
	 * @async
	 * @param {Object} req - The request object, containing the announcement data in the body.
	 * @param {Object} res - The response object used to send the result back to the client.
	 * @param {Function} next - The next middleware function in the stack for error handling.
	 *
	 * @returns {Promise<void>} A promise that resolves once the response is sent.
	 */
	createAnnouncementHandler = async (req, res, next) => {
		const { title, message } = req.body;

		if (!title || !message) {
			return res.status(400).json({ message: "Title and message are required." });
		}

		try {
			const announcementData = {
				title: title.trim(),
				message: message.trim(),
				userId: req.user._id,
			};

			const newAnnouncement = await this.db.createAnnouncement(announcementData);
			return res.success({
				msg: this.stringService.createAnnouncementHandler,
				data: newAnnouncement,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createAnnouncementHandler"));
		}
	};

	/**
	 * Handles retrieving announcements.
	 */
	getAnnouncementsHandler = async (req, res, next) => {
		try {
			const allAnnouncements = await this.db.getAnnouncements();
			return res.success({
				msg: this.stringService.getAnnouncementsHandler,
				data: allAnnouncements,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getAnnouncementsHandler"));
		}
	};
}

export default AnnouncementController;
