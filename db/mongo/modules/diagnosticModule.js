import DistributedUptimeCheck from "../../models/DistributedUptimeCheck.js";
import Monitor from "../../models/Monitor.js";
const SERVICE_NAME = "diagnosticModule";
import {
	buildDePINDetailsByDateRange,
	buildDePINLatestChecks,
} from "./monitorModuleQueries.js";
import { getDateRange } from "./monitorModule.js";

const getDistributedUptimeDbExecutionStats = async (req) => {
	try {
		const { monitorId } = req?.params ?? {};
		if (typeof monitorId === "undefined") {
			throw new Error();
		}
		const monitor = await Monitor.findById(monitorId);
		if (monitor === null || monitor === undefined) {
			throw new Error(this.stringService.dbFindMonitorById(monitorId));
		}

		const { dateRange } = req.query;
		const dates = getDateRange(dateRange);
		const formatLookup = {
			recent: "%Y-%m-%dT%H:%M:00Z",
			day: {
				$concat: [
					{ $dateToString: { format: "%Y-%m-%dT%H:", date: "$createdAt" } },
					{
						$cond: [{ $lt: [{ $minute: "$createdAt" }, 30] }, "00:00Z", "30:00Z"],
					},
				],
			},
			week: "%Y-%m-%dT%H:00:00Z",
			month: "%Y-%m-%dT00:00:00Z",
		};

		const dateString = formatLookup[dateRange];

		const dePINDetailsByDateRangeStats = await DistributedUptimeCheck.aggregate(
			buildDePINDetailsByDateRange(monitor, dates, dateString)
		).explain("executionStats");
		const latestChecksStats = await DistributedUptimeCheck.aggregate(
			buildDePINLatestChecks(monitor)
		).explain("executionStats");

		return {
			dePINDetailsByDateRangeStats,
			latestChecksStats,
		};
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "getAllMonitorsWithUptimeStats";
		throw error;
	}
};

export { getDistributedUptimeDbExecutionStats };
