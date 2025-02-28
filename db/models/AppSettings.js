import mongoose from "mongoose";

const AppSettingsSchema = mongoose.Schema(
    {
        apiBaseUrl: {
            type: String,
            required: true,
            default: process.env.VITE_APP_API_BASE_URL || "http://localhost:5000/api/v1",
        },
        logLevel: {
            type: String,
            default: process.env.LOG_LEVEL || "debug",
            enum: ["debug", "none", "error", "warn"],
        },
        clientHost: {
            type: String,
            required: true,
            default: process.env.CLIENT_HOST || "http://localhost:5173",
        },
        jwtSecret: {
            type: String,
            required: true,
            default: process.env.JWT_SECRET || "my_secret",
        },
        dbType: {
            type: String,
            required: true,
            default: process.env.DB_TYPE || "MongoDB",
        },
        dbConnectionString: {
            type: String,
            required: true,
            default: process.env.DBCONNECTION_STRING || "mongodb://localhost:27017/uptime_db",
        },
        redisHost: {
            type: String,
            required: true,
            default: process.env.REDIS_HOST || "127.0.0.1",
        },
        redisPort: {
            type: Number,
            default: process.env.REDIS_PORT || 6379,
        },
        jwtTTL: {
            type: String,
            required: true,
            default: process.env.JWT_TTL || "2h",
        },
        pagespeedApiKey: {
            type: String,
            default: process.env.PAGESPEED_API_KEY || "",
        },
        systemEmailHost: {
            type: String,
            default: process.env.SYSTEM_EMAIL_HOST || "smtp.gmail.com",
        },
        systemEmailPort: {
            type: Number,
            default: process.env.SYSTEM_EMAIL_PORT || 465,
        },
        systemEmailAddress: {
            type: String,
            default: process.env.SYSTEM_EMAIL_ADDRESS || "",
        },
        systemEmailPassword: {
            type: String,
            default: process.env.SYSTEM_EMAIL_PASSWORD || "",
        },
        singleton: {
            type: Boolean,
            required: true,
            unique: true,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("AppSettings", AppSettingsSchema);
