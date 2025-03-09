import DistributedUptimeCheck from "../../models/DistributedUptimeCheck.js";
import { ObjectId } from "mongodb";

const SERVICE_NAME = "distributedCheckModule";

const createDistributedCheck = async (checkData) => {
	try {
		if (typeof checkData.monitorId === "string") {
			checkData.monitorId = ObjectId.createFromHexString(checkData.monitorId);
		}
		const check = await DistributedUptimeCheck.findOneAndUpdate(
			{
				monitorId: checkData.monitorId,
				city: checkData.city,
			},
			[
				{
					$set: {
						...checkData,

						responseTime: {
							$cond: {
								if: { $ifNull: ["$count", false] },
								then: {
									$round: [
										{
											$divide: [
												{
													$add: [
														{ $multiply: ["$responseTime", "$count"] },
														checkData.responseTime,
													],
												},
												{ $add: ["$count", 1] },
											],
										},
										2,
									],
								},
								else: checkData.responseTime,
							},
						},
						count: { $add: [{ $ifNull: ["$count", 0] }, 1] },
					},
				},
			],
			{
				upsert: true,
				new: true,
				runValidators: true,
			}
		);
		return check;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "createCheck";
		throw error;
	}
};

const deleteDistributedChecksByMonitorId = async (monitorId) => {
	try {
		const result = await DistributedUptimeCheck.deleteMany({ monitorId });
		return result.deletedCount;
	} catch (error) {
		error.service = SERVICE_NAME;
		error.method = "deleteDistributedChecksByMonitorId";
		throw error;
	}
};

export { createDistributedCheck, deleteDistributedChecksByMonitorId };
