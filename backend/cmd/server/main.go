package main

import (
	"fmt"
	"log"
	"time"

	"subsTracker/config"
	"subsTracker/internal/handler"
	"subsTracker/internal/repository"
	"subsTracker/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	gin.SetMode(cfg.GinMode)

	db, err := repository.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	subRepo := repository.NewSubscriptionRepository(db)
	configRepo := repository.NewNotificationConfigRepository(db)
	logRepo := repository.NewNotificationLogRepository(db)

	subService := service.NewSubscriptionService(subRepo)
	notifyService := service.NewNotificationService(configRepo, logRepo)

	subHandler := handler.NewSubscriptionHandler(subService, notifyService)
	lunarHandler := handler.NewLunarHandler()
	configHandler := handler.NewNotificationConfigHandler(configRepo)
	testNotifyHandler := handler.NewTestNotificationHandler(notifyService, subService)

	startReminderScheduler(subService, notifyService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		subscriptions := api.Group("/subscriptions")
		{
			subscriptions.GET("", subHandler.GetAll)
			subscriptions.GET("/stats", subHandler.GetStats)
			subscriptions.GET("/expiring-soon", subHandler.GetExpiringSoon)
			subscriptions.GET("/expired", subHandler.GetExpired)
			subscriptions.GET("/:id", subHandler.GetByID)
			subscriptions.POST("", subHandler.Create)
			subscriptions.PUT("/:id", subHandler.Update)
			subscriptions.DELETE("/:id", subHandler.Delete)
			subscriptions.POST("/:id/toggle", subHandler.ToggleActive)
		}

		lunar := api.Group("/lunar")
		{
			lunar.GET("/info", lunarHandler.GetLunarInfo)
			lunar.POST("/to-solar", lunarHandler.LunarToSolar)
		}

		notifyConfig := api.Group("/notification-config")
		{
			notifyConfig.GET("", configHandler.Get)
			notifyConfig.PUT("", configHandler.Update)
		}

		test := api.Group("/test")
		{
			test.POST("/webhook", testNotifyHandler.TestWebhook)
			test.POST("/wechat-bot", testNotifyHandler.TestWechatBot)
			test.POST("/email", testNotifyHandler.TestEmail)
		}
	}

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func startReminderScheduler(subService service.SubscriptionService, notifyService service.NotificationService) {
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		checkAndSendReminders(subService, notifyService)
		for range ticker.C {
			checkAndSendReminders(subService, notifyService)
		}
	}()
}

func checkAndSendReminders(subService service.SubscriptionService, notifyService service.NotificationService) {
	subs, err := subService.GetAll(true)
	if err != nil {
		log.Printf("Failed to get subscriptions for reminder: %v", err)
		return
	}

	now := time.Now()
	for _, sub := range subs {
		daysUntilExpiry := int(sub.EndDate.Sub(now).Hours() / 24)

		if daysUntilExpiry >= 0 && daysUntilExpiry <= sub.ReminderDays {
			var lunarInfo map[string]interface{}
			var lunarMsg string
			if sub.IsLunarDate {
				lunarInfo, _ = subService.GetLunarInfo(sub.EndDate)
				if lunarInfo != nil {
					lunarMsg = fmt.Sprintf("\n农历日期: %s", lunarInfo["full_lunar_string"])
				}
			}

			title := fmt.Sprintf("订阅即将到期: %s", sub.Name)
			message := fmt.Sprintf(
				"您的订阅「%s」即将在 %d 天后到期。\n\n到期日期: %s\n服务类型: %s\n价格: %.2f %s\n是否自动续订: %v%s",
				sub.Name, daysUntilExpiry,
				sub.EndDate.Format("2006-01-02"),
				sub.ServiceType,
				sub.Price, sub.Currency,
				sub.IsAutoRenewal,
				lunarMsg,
			)

			if err := notifyService.SendAll(&sub, title, message); err != nil {
				log.Printf("Failed to send notifications for subscription %d: %v", sub.ID, err)
			} else {
				log.Printf("Sent reminders for subscription %d (%s)", sub.ID, sub.Name)
			}
		}

		if daysUntilExpiry < 0 {
			var lunarInfo map[string]interface{}
			var lunarMsg string
			if sub.IsLunarDate {
				lunarInfo, _ = subService.GetLunarInfo(sub.EndDate)
				if lunarInfo != nil {
					lunarMsg = fmt.Sprintf("\n农历日期: %s", lunarInfo["full_lunar_string"])
				}
			}

			title := fmt.Sprintf("订阅已过期: %s", sub.Name)
			message := fmt.Sprintf(
				"您的订阅「%s」已过期 %d 天。\n\n到期日期: %s\n服务类型: %s\n价格: %.2f %s\n%s",
				sub.Name, -daysUntilExpiry,
				sub.EndDate.Format("2006-01-02"),
				sub.ServiceType,
				sub.Price, sub.Currency,
				lunarMsg,
			)

			if err := notifyService.SendAll(&sub, title, message); err != nil {
				log.Printf("Failed to send expired notifications for subscription %d: %v", sub.ID, err)
			}
		}
	}
}
