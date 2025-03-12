import { triggerNotificationBodyValidation } from "../validation/joi.js";
import { handleError, handleValidationError } from "./controllerUtils.js";

const SERVICE_NAME = "NotificationController";

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

    _createTestNetworkResponse() {
        return {
            monitor: { 
                _id: "test-monitor-id", 
                name: "Test Monitor", 
                url: "https://example.com"
            },
            status: true,
            statusChanged: true,
            prevStatus: false,
        };
    }

    _handleTelegramTest(botToken, chatId) {
        if (!botToken || !chatId) {
            return {
                isValid: false,
                error: {
                    msg: "Telegram notifications require both botToken and chatId",
                    status: 400
                }
            };
        }

        return {
            isValid: true,
            notification: {
                type: NOTIFICATION_TYPES.WEBHOOK,
                platform: PLATFORMS.TELEGRAM,
                config: { botToken, chatId }
            }
        };
    }

    _handleWebhookTest(webhookUrl, platform) {
        if (webhookUrl === null) {
            return {
                isValid: false,
                error: {
                    msg: "Webhook URL is required",
                    status: 400
                }
            };
        }

        return {
            isValid: true,
            notification: {
                type: NOTIFICATION_TYPES.WEBHOOK,
                platform: platform,
                config: { webhookUrl }
            }
        };
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
            
            // Platform-specific handling
            const platformHandlers = {
                [PLATFORMS.TELEGRAM]: () => this._handleTelegramTest(botToken, chatId),
                // Default handler for webhook-based platforms (Slack, Discord, etc.)
                default: () => this._handleWebhookTest(webhookUrl, platform)
            };
            
            const handler = platformHandlers[platform] || platformHandlers.default;
            const handlerResult = handler();
            
            if (!handlerResult.isValid) {
                return res.error(handlerResult.error);
            }
            
            const networkResponse = this._createTestNetworkResponse();
            
            const result = await this.notificationService.sendWebhookNotification(
                networkResponse,
                handlerResult.notification
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