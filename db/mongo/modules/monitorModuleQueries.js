import { ObjectId } from "mongodb";

const buildUptimeDetailsPipeline = (monitor, dates, dateString) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
			},
		},
		{
			$sort: {
				createdAt: 1,
			},
		},
		{
			$facet: {
				aggregateData: [
					{
						$group: {
							_id: null,
							avgResponseTime: {
								$avg: "$responseTime",
							},
							lastCheck: {
								$last: "$$ROOT",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				uptimeStreak: [
					{
						$sort: {
							createdAt: -1,
						},
					},
					{
						$group: {
							_id: null,
							checks: { $push: "$$ROOT" },
						},
					},
					{
						$project: {
							streak: {
								$reduce: {
									input: "$checks",
									initialValue: { checks: [], foundFalse: false },
									in: {
										$cond: [
											{
												$and: [
													{ $not: "$$value.foundFalse" }, // stop reducing if a false check has been found
													{ $eq: ["$$this.status", true] }, // continue reducing if current check true
												],
											},
											// true case
											{
												checks: { $concatArrays: ["$$value.checks", ["$$this"]] },
												foundFalse: false, // Add the check to the streak
											},
											// false case
											{
												checks: "$$value.checks",
												foundFalse: true, // Mark that we found a false
											},
										],
									},
								},
							},
						},
					},
				],
				// For the response time chart, should return checks for date window
				// Grouped by: {day: hour}, {week: day}, {month: day}
				groupedChecks: [
					{
						$match: {
							createdAt: { $gte: dates.start, $lte: dates.end },
						},
					},
					{
						$group: {
							_id: {
								$dateToString: {
									format: dateString,
									date: "$createdAt",
								},
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
					{
						$sort: {
							_id: 1,
						},
					},
				],
				// Average response time for the date window
				groupAvgResponseTime: [
					{
						$match: {
							createdAt: { $gte: dates.start, $lte: dates.end },
						},
					},
					{
						$group: {
							_id: null,
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
				],
				// All UpChecks for the date window
				upChecks: [
					{
						$match: {
							status: true,
							createdAt: { $gte: dates.start, $lte: dates.end },
						},
					},
					{
						$group: {
							_id: null,
							avgResponseTime: {
								$avg: "$responseTime",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				// Up checks grouped by: {day: hour}, {week: day}, {month: day}
				groupedUpChecks: [
					{
						$match: {
							status: true,
							createdAt: { $gte: dates.start, $lte: dates.end },
						},
					},
					{
						$group: {
							_id: {
								$dateToString: {
									format: dateString,
									date: "$createdAt",
								},
							},
							totalChecks: {
								$sum: 1,
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
					{
						$sort: { _id: 1 },
					},
				],
				// All down checks for the date window
				downChecks: [
					{
						$match: {
							status: false,
							createdAt: { $gte: dates.start, $lte: dates.end },
						},
					},
					{
						$group: {
							_id: null,
							avgResponseTime: {
								$avg: "$responseTime",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				// Down checks grouped by: {day: hour}, {week: day}, {month: day} for the date window
				groupedDownChecks: [
					{
						$match: {
							status: false,
							createdAt: { $gte: dates.start, $lte: dates.end },
						},
					},
					{
						$group: {
							_id: {
								$dateToString: {
									format: dateString,
									date: "$createdAt",
								},
							},
							totalChecks: {
								$sum: 1,
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
					{
						$sort: { _id: 1 },
					},
				],
			},
		},
		{
			$project: {
				uptimeStreak: {
					$let: {
						vars: {
							checks: { $ifNull: [{ $first: "$uptimeStreak.streak.checks" }, []] },
						},
						in: {
							$cond: [
								{ $eq: [{ $size: "$$checks" }, 0] },
								0,
								{
									$subtract: [new Date(), { $last: "$$checks.createdAt" }],
								},
							],
						},
					},
				},
				avgResponseTime: {
					$arrayElemAt: ["$aggregateData.avgResponseTime", 0],
				},
				totalChecks: {
					$arrayElemAt: ["$aggregateData.totalChecks", 0],
				},
				latestResponseTime: {
					$arrayElemAt: ["$aggregateData.lastCheck.responseTime", 0],
				},
				timeSinceLastCheck: {
					$let: {
						vars: {
							lastCheck: {
								$arrayElemAt: ["$aggregateData.lastCheck", 0],
							},
						},
						in: {
							$cond: [
								{
									$ifNull: ["$$lastCheck", false],
								},
								{
									$subtract: [new Date(), "$$lastCheck.createdAt"],
								},
								0,
							],
						},
					},
				},
				groupedChecks: "$groupedChecks",
				groupedAvgResponseTime: {
					$arrayElemAt: ["$groupAvgResponseTime", 0],
				},
				upChecks: {
					$arrayElemAt: ["$upChecks", 0],
				},
				groupedUpChecks: "$groupedUpChecks",
				downChecks: {
					$arrayElemAt: ["$downChecks", 0],
				},
				groupedDownChecks: "$groupedDownChecks",
			},
		},
	];
};

const buildHardwareDetailsPipeline = (monitor, dates, dateString) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
				createdAt: { $gte: dates.start, $lte: dates.end },
			},
		},
		{
			$sort: {
				createdAt: 1,
			},
		},
		{
			$facet: {
				aggregateData: [
					{
						$group: {
							_id: null,
							latestCheck: {
								$last: "$$ROOT",
							},
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				upChecks: [
					{
						$match: {
							status: true,
						},
					},
					{
						$group: {
							_id: null,
							totalChecks: {
								$sum: 1,
							},
						},
					},
				],
				checks: [
					{
						$limit: 1,
					},
					{
						$project: {
							diskCount: {
								$size: "$disk",
							},
						},
					},
					{
						$lookup: {
							from: "hardwarechecks",
							let: {
								diskCount: "$diskCount",
							},
							pipeline: [
								{
									$match: {
										$expr: {
											$and: [
												{ $eq: ["$monitorId", monitor._id] },
												{ $gte: ["$createdAt", dates.start] },
												{ $lte: ["$createdAt", dates.end] },
											],
										},
									},
								},
								{
									$group: {
										_id: {
											$dateToString: {
												format: dateString,
												date: "$createdAt",
											},
										},
										avgCpuUsage: {
											$avg: "$cpu.usage_percent",
										},
										avgMemoryUsage: {
											$avg: "$memory.usage_percent",
										},
										avgTemperatures: {
											$push: {
												$ifNull: ["$cpu.temperature", [0]],
											},
										},
										disks: {
											$push: "$disk",
										},
									},
								},
								{
									$project: {
										_id: 1,
										avgCpuUsage: 1,
										avgMemoryUsage: 1,
										avgTemperature: {
											$map: {
												input: {
													$range: [
														0,
														{
															$size: {
																// Handle null temperatures array
																$ifNull: [
																	{ $arrayElemAt: ["$avgTemperatures", 0] },
																	[0], // Default to single-element array if null
																],
															},
														},
													],
												},
												as: "index",
												in: {
													$avg: {
														$map: {
															input: "$avgTemperatures",
															as: "tempArray",
															in: {
																$ifNull: [
																	{ $arrayElemAt: ["$$tempArray", "$$index"] },
																	0, // Default to 0 if element is null
																],
															},
														},
													},
												},
											},
										},
										disks: {
											$map: {
												input: {
													$range: [0, "$$diskCount"],
												},
												as: "diskIndex",
												in: {
													name: {
														$concat: [
															"disk",
															{
																$toString: "$$diskIndex",
															},
														],
													},
													readSpeed: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: [
																		"$$diskArray.read_speed_bytes",
																		"$$diskIndex",
																	],
																},
															},
														},
													},
													writeSpeed: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: [
																		"$$diskArray.write_speed_bytes",
																		"$$diskIndex",
																	],
																},
															},
														},
													},
													totalBytes: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: [
																		"$$diskArray.total_bytes",
																		"$$diskIndex",
																	],
																},
															},
														},
													},
													freeBytes: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: ["$$diskArray.free_bytes", "$$diskIndex"],
																},
															},
														},
													},
													usagePercent: {
														$avg: {
															$map: {
																input: "$disks",
																as: "diskArray",
																in: {
																	$arrayElemAt: [
																		"$$diskArray.usage_percent",
																		"$$diskIndex",
																	],
																},
															},
														},
													},
												},
											},
										},
									},
								},
							],
							as: "hourlyStats",
						},
					},
					{
						$unwind: "$hourlyStats",
					},
					{
						$replaceRoot: {
							newRoot: "$hourlyStats",
						},
					},
				],
			},
		},
		{
			$project: {
				aggregateData: {
					$arrayElemAt: ["$aggregateData", 0],
				},
				upChecks: {
					$arrayElemAt: ["$upChecks", 0],
				},
				checks: {
					$sortArray: {
						input: "$checks",
						sortBy: { _id: 1 },
					},
				},
			},
		},
	];
};

const buildMonitorStatsPipeline = (monitor) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
			},
		},
		{
			$project: {
				avgResponseTime: 1,
				uptimePercentage: 1,
				totalChecks: 1,
				timeSinceLastCheck: {
					$subtract: [Date.now(), "$lastCheckTimestamp"],
				},
				lastCheckTimestamp: 1,
				uptBurnt: { $toString: "$uptBurnt" },
			},
		},
	];
};

const buildMonitorSummaryByTeamIdPipeline = ({ matchStage }) => {
	return [
		{ $match: matchStage },
		{
			$group: {
				_id: null,
				totalMonitors: { $sum: 1 },
				upMonitors: {
					$sum: {
						$cond: [{ $eq: ["$status", true] }, 1, 0],
					},
				},
				downMonitors: {
					$sum: {
						$cond: [{ $eq: ["$status", false] }, 1, 0],
					},
				},
				pausedMonitors: {
					$sum: {
						$cond: [{ $eq: ["$isActive", false] }, 1, 0],
					},
				},
			},
		},
		{
			$project: {
				_id: 0,
			},
		},
	];
};

const buildMonitorsByTeamIdPipeline = ({ matchStage, field, order }) => {
	const sort = { [field]: order === "asc" ? 1 : -1 };

	return [
		{ $match: matchStage },
		{ $sort: sort },
		{
			$project: {
				_id: 1,
				name: 1,
				type: 1,
			},
		},
	];
};

const buildMonitorsAndSummaryByTeamIdPipeline = ({ matchStage }) => {
	return [
		{ $match: matchStage },
		{
			$facet: {
				summary: [
					{
						$group: {
							_id: null,
							totalMonitors: { $sum: 1 },
							upMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", true] }, 1, 0],
								},
							},
							downMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", false] }, 1, 0],
								},
							},
							pausedMonitors: {
								$sum: {
									$cond: [{ $eq: ["$isActive", false] }, 1, 0],
								},
							},
						},
					},
					{
						$project: {
							_id: 0,
						},
					},
				],
				monitors: [
					{ $sort: { name: 1 } },
					{
						$project: {
							_id: 1,
							name: 1,
							type: 1,
						},
					},
				],
			},
		},
		{
			$project: {
				summary: { $arrayElemAt: ["$summary", 0] },
				monitors: 1,
			},
		},
	];
};

const buildMonitorsWithChecksByTeamIdPipeline = ({
	matchStage,
	filter,
	page,
	rowsPerPage,
	field,
	order,
	limit,
	type,
}) => {
	const skip = page && rowsPerPage ? page * rowsPerPage : 0;
	const sort = { [field]: order === "asc" ? 1 : -1 };
	const limitStage = rowsPerPage ? [{ $limit: rowsPerPage }] : [];
	if (typeof filter !== "undefined") {
		matchStage.$or = [
			{ name: { $regex: filter, $options: "i" } },
			{ url: { $regex: filter, $options: "i" } },
		];
	}

	const monitorsPipeline = [
		{ $sort: sort },
		{ $skip: skip },
		...limitStage,
		{
			$project: {
				_id: 1,
				name: 1,
				description: 1,
				type: 1,
				url: 1,
				isActive: 1,
				createdAt: 1,
				updatedAt: 1,
				uptimePercentage: 1,
				status: 1,
			},
		},
	];

	// Add checks
	if (limit) {
		let checksCollection = "checks";
		if (type === "pagespeed") {
			checksCollection = "pagespeedchecks";
		} else if (type === "hardware") {
			checksCollection = "hardwarechecks";
		} else if (type === "distributed_http" || type === "distributed_test") {
			checksCollection = "distributeduptimechecks";
		}
		monitorsPipeline.push({
			$lookup: {
				from: checksCollection,
				let: { monitorId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ["$monitorId", "$$monitorId"] },
						},
					},
					{ $sort: { updatedAt: -1 } },
					{ $limit: limit },
					{
						$project: {
							_id: 1,
							status: 1,
							responseTime: 1,
							statusCode: 1,
							createdAt: 1,
							updatedAt: 1,
							originalResponseTime: 1,
						},
					},
				],
				as: "checks",
			},
		});
	}

	const pipeline = [
		{ $match: matchStage },
		{
			$facet: {
				count: [{ $count: "monitorsCount" }],
				monitors: monitorsPipeline,
			},
		},
		{
			$project: {
				count: { $arrayElemAt: ["$count", 0] },
				monitors: 1,
			},
		},
	];
	return pipeline;
};

const buildFilteredMonitorsByTeamIdPipeline = ({
	matchStage,
	filter,
	page,
	rowsPerPage,
	field,
	order,
	limit,
	type,
}) => {
	const skip = page && rowsPerPage ? page * rowsPerPage : 0;
	const sort = { [field]: order === "asc" ? 1 : -1 };
	const limitStage = rowsPerPage ? [{ $limit: rowsPerPage }] : [];

	if (typeof filter !== "undefined") {
		matchStage.$or = [
			{ name: { $regex: filter, $options: "i" } },
			{ url: { $regex: filter, $options: "i" } },
		];
	}

	const pipeline = [
		{ $match: matchStage },
		{ $sort: sort },
		{ $skip: skip },
		...limitStage,
	];

	// Add checks
	if (limit) {
		let checksCollection = "checks";
		if (type === "pagespeed") {
			checksCollection = "pagespeedchecks";
		} else if (type === "hardware") {
			checksCollection = "hardwarechecks";
		} else if (type === "distributed_http" || type === "distributed_test") {
			checksCollection = "distributeduptimechecks";
		}
		pipeline.push({
			$lookup: {
				from: checksCollection,
				let: { monitorId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ["$monitorId", "$$monitorId"] },
						},
					},
					{ $sort: { createdAt: -1 } },
					{ $limit: limit },
				],
				as: "checks",
			},
		});
	}

	return pipeline;
};

const buildGetMonitorsByTeamIdPipeline = (req) => {
	let { limit, type, page, rowsPerPage, filter, field, order } = req.query;

	limit = parseInt(limit);
	page = parseInt(page);
	rowsPerPage = parseInt(rowsPerPage);
	if (field === undefined) {
		field = "name";
		order = "asc";
	}
	// Build the match stage
	const matchStage = { teamId: ObjectId.createFromHexString(req.params.teamId) };
	if (type !== undefined) {
		matchStage.type = Array.isArray(type) ? { $in: type } : type;
	}

	const skip = page && rowsPerPage ? page * rowsPerPage : 0;
	const sort = { [field]: order === "asc" ? 1 : -1 };
	return [
		{ $match: matchStage },
		{
			$facet: {
				summary: [
					{
						$group: {
							_id: null,
							totalMonitors: { $sum: 1 },
							upMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", true] }, 1, 0],
								},
							},
							downMonitors: {
								$sum: {
									$cond: [{ $eq: ["$status", false] }, 1, 0],
								},
							},
							pausedMonitors: {
								$sum: {
									$cond: [{ $eq: ["$isActive", false] }, 1, 0],
								},
							},
						},
					},
					{
						$project: {
							_id: 0,
						},
					},
				],
				monitors: [
					{ $sort: sort },
					{
						$project: {
							_id: 1,
							name: 1,
						},
					},
				],
				filteredMonitors: [
					...(filter !== undefined
						? [
								{
									$match: {
										$or: [
											{ name: { $regex: filter, $options: "i" } },
											{ url: { $regex: filter, $options: "i" } },
										],
									},
								},
							]
						: []),
					{ $sort: sort },
					{ $skip: skip },
					...(rowsPerPage ? [{ $limit: rowsPerPage }] : []),
					...(limit
						? [
								{
									$lookup: {
										from: "checks",
										let: { monitorId: "$_id" },
										pipeline: [
											{
												$match: {
													$expr: { $eq: ["$monitorId", "$$monitorId"] },
												},
											},
											{ $sort: { createdAt: -1 } },
											...(limit ? [{ $limit: limit }] : []),
										],
										as: "standardchecks",
									},
								},
							]
						: []),
					...(limit
						? [
								{
									$lookup: {
										from: "pagespeedchecks",
										let: { monitorId: "$_id" },
										pipeline: [
											{
												$match: {
													$expr: { $eq: ["$monitorId", "$$monitorId"] },
												},
											},
											{ $sort: { createdAt: -1 } },
											...(limit ? [{ $limit: limit }] : []),
										],
										as: "pagespeedchecks",
									},
								},
							]
						: []),
					...(limit
						? [
								{
									$lookup: {
										from: "hardwarechecks",
										let: { monitorId: "$_id" },
										pipeline: [
											{
												$match: {
													$expr: { $eq: ["$monitorId", "$$monitorId"] },
												},
											},
											{ $sort: { createdAt: -1 } },
											...(limit ? [{ $limit: limit }] : []),
										],
										as: "hardwarechecks",
									},
								},
							]
						: []),
					...(limit
						? [
								{
									$lookup: {
										from: "distributeduptimechecks",
										let: { monitorId: "$_id" },
										pipeline: [
											{
												$match: {
													$expr: { $eq: ["$monitorId", "$$monitorId"] },
												},
											},
											{ $sort: { createdAt: -1 } },
											...(limit ? [{ $limit: limit }] : []),
										],
										as: "distributeduptimechecks",
									},
								},
							]
						: []),

					{
						$addFields: {
							checks: {
								$switch: {
									branches: [
										{
											case: { $in: ["$type", ["http", "ping", "docker", "port"]] },
											then: "$standardchecks",
										},
										{
											case: { $eq: ["$type", "pagespeed"] },
											then: "$pagespeedchecks",
										},
										{
											case: { $eq: ["$type", "hardware"] },
											then: "$hardwarechecks",
										},
										{
											case: { $eq: ["$type", "distributed_http"] },
											then: "$distributeduptimechecks",
										},
										{
											case: { $eq: ["$type", "distributed_test"] },
											then: "$distributeduptimechecks",
										},
									],
									default: [],
								},
							},
						},
					},
					{
						$project: {
							standardchecks: 0,
							pagespeedchecks: 0,
							hardwarechecks: 0,
						},
					},
				],
			},
		},
		{
			$project: {
				summary: { $arrayElemAt: ["$summary", 0] },
				filteredMonitors: 1,
				monitors: 1,
			},
		},
	];
};

const buildDePINDetailsByDateRange = (monitor, dates, dateString) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
				updatedAt: { $gte: dates.start, $lte: dates.end },
			},
		},
		{
			$project: {
				_id: 0,
				city: 1,
				updatedAt: 1,
				"location.lat": 1,
				"location.lng": 1,
				responseTime: 1,
			},
		},
		{
			$facet: {
				groupedMapChecks: [
					{
						$group: {
							_id: {
								city: "$city",
								lat: "$location.lat",
								lng: "$location.lng",
							},

							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
				],
				groupedChecks: [
					{
						$group: {
							_id: {
								date: {
									$dateToString: {
										format: dateString,
										date: "$updatedAt",
									},
								},
							},
							avgResponseTime: {
								$avg: "$responseTime",
							},
						},
					},
					{
						$sort: {
							"_id.date": 1,
						},
					},
				],
			},
		},
		{
			$project: {
				groupedMapChecks: "$groupedMapChecks",
				groupedChecks: "$groupedChecks",
			},
		},
	];
};

const buildDePINLatestChecks = (monitor) => {
	return [
		{
			$match: {
				monitorId: monitor._id,
			},
		},
		{
			$sort: { updatedAt: -1 },
		},
		{
			$limit: 5,
		},
		{
			$project: {
				responseTime: 1,
				city: 1,
				countryCode: 1,
				uptBurnt: {
					$toString: {
						$ifNull: ["$uptBurnt", 0],
					},
				},
			},
		},
	];
};

export {
	buildUptimeDetailsPipeline,
	buildHardwareDetailsPipeline,
	buildMonitorStatsPipeline,
	buildGetMonitorsByTeamIdPipeline,
	buildMonitorSummaryByTeamIdPipeline,
	buildMonitorsByTeamIdPipeline,
	buildMonitorsAndSummaryByTeamIdPipeline,
	buildMonitorsWithChecksByTeamIdPipeline,
	buildFilteredMonitorsByTeamIdPipeline,
	buildDePINDetailsByDateRange,
	buildDePINLatestChecks,
};
