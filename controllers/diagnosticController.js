import { handleError } from "./controllerUtils.js";
const SERVICE_NAME = "diagnosticController";

class DiagnosticController {
	constructor(db) {
		this.db = db;
		this.getDistributedUptimeDbExecutionStats =
			this.getDistributedUptimeDbExecutionStats.bind(this);
	}

	async getDistributedUptimeDbExecutionStats(req, res, next) {
		try {
			const data = await this.db.getDistributedUptimeDbExecutionStats(req);
			return res.success({
				msg: "OK",
				data,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getDbExecutionStats"));
		}
	}
}
export default DiagnosticController;
