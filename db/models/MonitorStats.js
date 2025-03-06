import mongoose from "mongoose";

const MonitorSatsSchema = new mongoose.Schema(
	{
		monitorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Monitor",
			immutable: true,
			index: true,
		},
		avgResponseTime: {
			type: Number,
			default: 0,
		},
		totalChecks: {
			type: Number,
			default: 0,
		},
		totalUpChecks: {
			type: Number,
			default: 0,
		},
		totalDownChecks: {
			type: Number,
			default: 0,
		},
		uptimePercentage: {
			type: Number,
			default: 0,
		},
		lastCheck: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Check",
			default: null,
		},
		timeSinceLastCheck: {
			type: Number,
			default: 0,
		},
		uptBurnt: {
			type: mongoose.Schema.Types.Decimal128,
			required: false,
		},
	},
	{ timestamps: true }
);

const MonitorSats = mongoose.model("MonitorSats", MonitorSatsSchema);

export default MonitorSats;
