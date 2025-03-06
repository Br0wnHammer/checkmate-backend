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
	}

	getRouter() {
		return this.router;
	}
}

export default DiagnosticRoutes;
