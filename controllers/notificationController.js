import { triggerNotificationBodyValidation } from "../validation/joi.js";
import { handleError, handleValidationError } from "./controllerUtils.js";

const SERVICE_NAME = "NotificationController";

// Extract constants
const NOTIFICATION_TYPES = {
  WEBHOOK: 'webhook',
  TELEGRAM: 'telegram'
};

const PLATFORMS = {
  SLACK: 'slack',
  DISCORD: 'discord',
  TELEGRAM: 'telegram'
};

class NotificationController {
    constructor(notificationService, stringService) {
        this.notificationService = notificationService;
        this.stringService = stringService;
        this.triggerNotification = this.triggerNotification.bind(this);
        this.testWebhook = this.testWebhook.bind(this); 
    }

    async triggerNotification(req, res, next) {
        try {
            await triggerNotificationBodyValidation.validateAsync(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
        } catch (error) {
            next(handleValidationError(error, SERVICE_NAME));
            return;
        }

        try {
            const { monitorId, type, platform, config, status = false } = req.body;

            if (type === NOTIFICATION_TYPES.WEBHOOK) {
                const notification = {
                    type,
                    platform,
                    config,
                };

                await this.notificationService.sendWebhookNotification(
                    networkResponse,
                    notification
                );
            }

            return res.success({
                msg: this.stringService.webhookSendSuccess,
            });
        } catch (error) {
            next(handleError(error, SERVICE_NAME, "triggerNotification"));
        }
    }

    async testWebhook(req, res, next) {
        try {
            const { webhookUrl, platform, botToken, chatId } = req.body;

            if (platform === null) {
                return res.error({
                    msg: "Platform is required",
                    status: 400
                });
            }
        
            if (platform === PLATFORMS.TELEGRAM) {
                if (!botToken || !chatId) {
                    return res.error({
                        msg: "Telegram notifications require both botToken and chatId",
                        status: 400
                    });
                }
            } else {
                if (webhookUrl === null) {
                    return res.error({
                        msg: "Webhook URL is required",
                        status: 400
                    });
                }
            }
        
            // Create a simplified test monitor and status
            const networkResponse = {
                monitor: { 
                    _id: "test-monitor-id", 
                    name: "Test Monitor", 
                    url: "https://example.com"
                },
                status: true,
                statusChanged: true,
                prevStatus: false,
            };
        
            // Create notification config
            let notification = {
                type: NOTIFICATION_TYPES.WEBHOOK,
                platform: platform
            };
        
            // Set config based on platform
            if (platform === PLATFORMS.TELEGRAM) {
                notification.config = { 
                    botToken,
                    chatId
                };
            } else {
                notification.config = { 
                    webhookUrl 
                };
            }

            const result = await this.notificationService.sendWebhookNotification(
                networkResponse,
                notification
            );
        
            if (result && result !== false) {
                return res.success({
                    msg: this.stringService.webhookSendSuccess || "Test notification sent successfully",
                });
            } else {
                return res.error({
                    msg: "Failed to send test notification",
                    status: 400
                });
            }
        } catch (error) {
            next(handleError(error, SERVICE_NAME, "testWebhook"));
        }
    }
}

export default NotificationController;