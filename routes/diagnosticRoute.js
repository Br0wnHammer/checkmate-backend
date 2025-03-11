import { Router } from "express";

class DiagnosticRoutes {
	constructor(diagnosticController) {
		this.router = Router();
		this.diagnosticController = diagnosticController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.get(
			"/db/execution-stats/:monitorId",
			this.diagnosticController.getDistributedUptimeDbExecutionStats
		);

		this.router.get(
			"/db/get-monitors-by-team-id/:teamId",
			this.diagnosticController.getMonitorsByTeamIdExecutionStats
		);
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
