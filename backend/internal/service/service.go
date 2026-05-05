package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"subsTracker/config"
	"subsTracker/internal/lunar"
	"subsTracker/internal/model"
	"subsTracker/internal/repository"

	"github.com/resend/resend-go/v2"
)

type NotificationService interface {
	SendWebhook(sub *model.Subscription, title, message string) error
	SendWechatBot(sub *model.Subscription, title, message string) error
	SendEmail(sub *model.Subscription, title, message string) error
	SendAll(sub *model.Subscription, title, message string) error
	LogNotification(subID uint, notifyType, message string, isSuccess bool, errMsg string) error
}

type notificationService struct {
	configRepo repository.NotificationConfigRepository
	logRepo    repository.NotificationLogRepository
	resendClient *resend.Client
}

func NewNotificationService(configRepo repository.NotificationConfigRepository, logRepo repository.NotificationLogRepository) NotificationService {
	var client *resend.Client
	if config.AppConfig.ResendAPIKey != "" {
		client = resend.NewClient(config.AppConfig.ResendAPIKey)
	}
	return &notificationService{
		configRepo:   configRepo,
		logRepo:      logRepo,
		resendClient: client,
	}
}

func (s *notificationService) LogNotification(subID uint, notifyType, message string, isSuccess bool, errMsg string) error {
	log := &model.NotificationLog{
		SubscriptionID: subID,
		NotifyType:     notifyType,
		Message:        message,
		IsSuccess:      isSuccess,
		ErrorMsg:       errMsg,
		CreatedAt:      time.Now(),
	}
	return s.logRepo.Create(log)
}

func (s *notificationService) SendWebhook(sub *model.Subscription, title, message string) error {
	cfg, err := s.configRepo.Get()
	if err != nil {
		return err
	}
	
	if cfg.WebhookURL == "" {
		return fmt.Errorf("webhook URL not configured")
	}
	
	payload := map[string]interface{}{
		"title":       title,
		"message":     message,
		"subscription": map[string]interface{}{
			"id":          sub.ID,
			"name":        sub.Name,
			"service_type": sub.ServiceType,
			"end_date":    sub.EndDate.Format("2006-01-02"),
			"price":       sub.Price,
			"is_lunar":    sub.IsLunarDate,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	
	req, err := http.NewRequest(cfg.WebhookMethod, cfg.WebhookURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	if cfg.WebhookHeaders != "" {
		var headers map[string]string
		if err := json.Unmarshal([]byte(cfg.WebhookHeaders), &headers); err == nil {
			for k, v := range headers {
				req.Header.Set(k, v)
			}
		}
	}
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook request failed with status: %d", resp.StatusCode)
	}
	
	return nil
}

func (s *notificationService) SendWechatBot(sub *model.Subscription, title, message string) error {
	cfg, err := s.configRepo.Get()
	if err != nil {
		return err
	}
	
	if cfg.WechatBotURL == "" {
		return fmt.Errorf("wechat bot URL not configured")
	}
	
	payload := map[string]interface{}{
		"msgtype": "markdown",
		"markdown": map[string]string{
			"content": fmt.Sprintf("### %s\n\n%s", title, message),
		},
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	
	req, err := http.NewRequest("POST", cfg.WechatBotURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("wechat bot request failed with status: %d", resp.StatusCode)
	}
	
	return nil
}

func (s *notificationService) SendEmail(sub *model.Subscription, title, message string) error {
	if s.resendClient == nil {
		return fmt.Errorf("resend client not configured")
	}
	
	cfg, err := s.configRepo.Get()
	if err != nil {
		return err
	}
	
	var recipients []string
	if sub.NotifyEmails != "" {
		recipients = append(recipients, sub.NotifyEmails)
	}
	if cfg.EmailRecipients != "" {
		recipients = append(recipients, cfg.EmailRecipients)
	}
	
	if len(recipients) == 0 {
		return fmt.Errorf("no email recipients configured")
	}
	
	htmlContent := fmt.Sprintf(`
		<html>
		<body>
		<h2>%s</h2>
		<p>%s</p>
		<hr>
		<h3>订阅详情：</h3>
		<ul>
			<li><strong>服务名称：</strong>%s</li>
			<li><strong>服务类型：</strong>%s</li>
			<li><strong>到期日期：</strong>%s</li>
			<li><strong>价格：</strong>%.2f %s</li>
		</ul>
		</body>
		</html>
	`, title, message, sub.Name, sub.ServiceType, sub.EndDate.Format("2006-01-02"), sub.Price, sub.Currency)
	
	params := &resend.SendEmailRequest{
		From:    config.AppConfig.ResendFrom,
		To:      recipients,
		Subject: title,
		Html:    htmlContent,
	}
	
	_, err = s.resendClient.Emails.Send(params)
	return err
}

func (s *notificationService) SendAll(sub *model.Subscription, title, message string) error {
	var errs []error
	
	if sub.NotifyWebhook {
		if err := s.SendWebhook(sub, title, message); err != nil {
			errs = append(errs, fmt.Errorf("webhook: %w", err))
			s.LogNotification(sub.ID, "webhook", message, false, err.Error())
		} else {
			s.LogNotification(sub.ID, "webhook", message, true, "")
		}
	}
	
	if sub.NotifyWechatBot {
		if err := s.SendWechatBot(sub, title, message); err != nil {
			errs = append(errs, fmt.Errorf("wechat_bot: %w", err))
			s.LogNotification(sub.ID, "wechat_bot", message, false, err.Error())
		} else {
			s.LogNotification(sub.ID, "wechat_bot", message, true, "")
		}
	}
	
	if sub.NotifyEmail {
		if err := s.SendEmail(sub, title, message); err != nil {
			errs = append(errs, fmt.Errorf("email: %w", err))
			s.LogNotification(sub.ID, "email", message, false, err.Error())
		} else {
			s.LogNotification(sub.ID, "email", message, true, "")
		}
	}
	
	if len(errs) > 0 {
		return fmt.Errorf("some notifications failed: %v", errs)
	}
	return nil
}

type SubscriptionService interface {
	Create(sub *model.Subscription) error
	Update(sub *model.Subscription) error
	Delete(id uint) error
	GetByID(id uint) (*model.Subscription, error)
	GetAll(activeOnly bool) ([]model.Subscription, error)
	ToggleActive(id uint) error
	CalculateNextRenewal(sub *model.Subscription) (time.Time, error)
	GetExpiringSoon() ([]model.Subscription, error)
	GetExpired() ([]model.Subscription, error)
	GetStats() (*model.SubscriptionStats, error)
	GetLunarInfo(date time.Time) (map[string]interface{}, error)
}

type subscriptionService struct {
	repo   repository.SubscriptionRepository
}

func NewSubscriptionService(repo repository.SubscriptionRepository) SubscriptionService {
	return &subscriptionService{repo: repo}
}

func (s *subscriptionService) Create(sub *model.Subscription) error {
	sub.CreatedAt = time.Now()
	sub.UpdatedAt = time.Now()
	return s.repo.Create(sub)
}

func (s *subscriptionService) Update(sub *model.Subscription) error {
	sub.UpdatedAt = time.Now()
	return s.repo.Update(sub)
}

func (s *subscriptionService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *subscriptionService) GetByID(id uint) (*model.Subscription, error) {
	return s.repo.FindByID(id)
}

func (s *subscriptionService) GetAll(activeOnly bool) ([]model.Subscription, error) {
	return s.repo.FindAll(activeOnly)
}

func (s *subscriptionService) ToggleActive(id uint) error {
	sub, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	sub.IsActive = !sub.IsActive
	sub.UpdatedAt = time.Now()
	return s.repo.Update(sub)
}

func (s *subscriptionService) CalculateNextRenewal(sub *model.Subscription) (time.Time, error) {
	if !sub.IsAutoRenewal {
		return sub.EndDate, nil
	}

	nextDate := sub.EndDate
	switch sub.RenewalCycle {
	case "monthly":
		nextDate = nextDate.AddDate(0, 1, 0)
	case "quarterly":
		nextDate = nextDate.AddDate(0, 3, 0)
	case "yearly":
		nextDate = nextDate.AddDate(1, 0, 0)
	case "weekly":
		nextDate = nextDate.AddDate(0, 0, 7)
	}

	return nextDate, nil
}

func (s *subscriptionService) GetExpiringSoon() ([]model.Subscription, error) {
	return s.repo.FindExpiringSoon(7)
}

func (s *subscriptionService) GetExpired() ([]model.Subscription, error) {
	return s.repo.FindExpired()
}

func (s *subscriptionService) GetStats() (*model.SubscriptionStats, error) {
	return s.repo.GetStats()
}

func (s *subscriptionService) GetLunarInfo(date time.Time) (map[string]interface{}, error) {
	return lunar.GetLunarInfo(date.Year(), int(date.Month()), date.Day())
}
