import Monitor from "../../models/Monitor.js";
import Check from "../../models/Check.js";
import DistributedUptimeCheck from "../../models/DistributedUptimeCheck.js";

const generateRandomUrl = () => {
	const domains = ["example.com", "test.org", "demo.net", "sample.io", "mock.dev"];
	const paths = ["api", "status", "health", "ping", "check"];
	return `https://${domains[Math.floor(Math.random() * domains.length)]}/${paths[Math.floor(Math.random() * paths.length)]}`;
};

const generateChecks = (monitorId, teamId, count) => {
	const checks = [];
	const endTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
	const startTime = new Date(endTime - count * 60 * 1000); // count minutes before endTime

	for (let i = 0; i < count; i++) {
		const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
		const status = Math.random() > 0.05; // 95% chance of being up

		checks.push({
			monitorId,
			teamId,
			status,
			responseTime: Math.floor(Math.random() * 1000), // Random response time between 0-1000ms
			createdAt: timestamp,
			updatedAt: timestamp,
		});
	}

	return checks;
};

const seedDb = async (userId, teamId) => {
	try {
		console.log("Deleting all monitors and checks");
		await Monitor.deleteMany({});
		await Check.deleteMany({});
		console.log("Adding monitors");
		for (let i = 0; i < 300; i++) {
			const monitor = await Monitor.create({
				name: `Monitor ${i}`,
				url: generateRandomUrl(),
				type: "http",
				userId,
				teamId,
				interval: 60000,
				active: false,
			});
			console.log(`Adding monitor and checks for monitor ${i}`);
			const checks = generateChecks(monitor._id, teamId, 10000);
			await Check.insertMany(checks);
		}
	} catch (error) {
		console.error(error);
	}
};

const generateDistributedChecks = (monitorId, teamId, count = 2880) => {
	const checks = [];
	const endTime = new Date();
	const startTime = new Date(endTime - 48 * 60 * 60 * 1000);

	// Sample locations for variety
	const locations = [
		{
			city: "New York",
			countryCode: "US",
			continent: "NA",
			location: { lat: 40.7128, lng: -74.006 },
		},
		{
			city: "London",
			countryCode: "GB",
			continent: "EU",
			location: { lat: 51.5074, lng: -0.1278 },
		},
		{
			city: "Singapore",
			countryCode: "SG",
			continent: "AS",
			location: { lat: 1.3521, lng: 103.8198 },
		},
	];

	for (let i = 0; i < count; i++) {
		const timestamp = new Date(startTime.getTime() + i * 60 * 1000);
		const location = locations[Math.floor(Math.random() * locations.length)];
		const status = Math.random() > 0.05; // 95% success rate

		checks.push({
			monitorId,
			teamId,
			status,
			responseTime: Math.floor(Math.random() * 1000), // Random response time between 0-1000ms
			first_byte_took: Math.floor(Math.random() * 300000), // 0-300ms
			body_read_took: Math.floor(Math.random() * 100000), // 0-100ms
			dns_took: Math.floor(Math.random() * 100000), // 0-100ms
			conn_took: Math.floor(Math.random() * 200000), // 0-200ms
			connect_took: Math.floor(Math.random() * 150000), // 0-150ms
			tls_took: Math.floor(Math.random() * 200000), // 0-200ms
			location: location.location,
			continent: location.continent,
			countryCode: location.countryCode,
			city: location.city,
			uptBurnt: "0.01", // Will be converted to Decimal128 by the schema
			createdAt: timestamp,
			updatedAt: timestamp,
		});
	}

	return checks;
};

export const seedDistributedTest = async (userId, teamId) => {
	try {
		console.log("Deleting all test monitors and checks");
		const testMonitors = await Monitor.find({
			type: "distributed_test",
		});

		testMonitors.forEach(async (monitor) => {
			await DistributedUptimeCheck.deleteMany({ monitorId: monitor._id });
			await Monitor.deleteOne({ _id: monitor._id });
		});

		console.log("Adding test monitors and checks");
		const monitor = await Monitor.create({
			name: "Distributed Test",
			url: "https://distributed-test.com",
			type: "distributed_test",
			userId,
			teamId,
			interval: 60000,
			active: false,
		});
		const checks = generateDistributedChecks(monitor._id, teamId, 2800);
		await DistributedUptimeCheck.insertMany(checks);
		return monitor;
	} catch (error) {
		console.error(error);
		throw error;
	}
};

export default seedDb;
