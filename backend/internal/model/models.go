package model

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type Subscription struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	Name            string         `json:"name" gorm:"not null"`
	ServiceType     string         `json:"service_type" gorm:"type:varchar(50)"`
	StartDate       time.Time      `json:"start_date" gorm:"not null"`
	EndDate         time.Time      `json:"end_date" gorm:"not null"`
	IsLunarDate     bool           `json:"is_lunar_date" gorm:"default:false"`
	IsAutoRenewal   bool           `json:"is_auto_renewal" gorm:"default:false"`
	RenewalCycle    string         `json:"renewal_cycle" gorm:"type:varchar(20);default:'yearly'"`
	ReminderDays    int            `json:"reminder_days" gorm:"default:3"`
	Price           float64        `json:"price" gorm:"type:decimal(10,2)"`
	Currency        string         `json:"currency" gorm:"type:varchar(10);default:'CNY'"`
	IsActive        bool           `json:"is_active" gorm:"default:true"`
	Notes           string         `json:"notes" gorm:"type:text"`
	NotifyWebhook   bool           `json:"notify_webhook" gorm:"default:false"`
	NotifyWechatBot bool           `json:"notify_wechat_bot" gorm:"default:false"`
	NotifyEmail     bool           `json:"notify_email" gorm:"default:false"`
	NotifyEmails    string         `json:"notify_emails" gorm:"type:varchar(500)"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

type SubscriptionDTO struct {
	ID              uint    `json:"id"`
	Name            string  `json:"name"`
	ServiceType     string  `json:"service_type"`
	StartDate       string  `json:"start_date"`
	EndDate         string  `json:"end_date"`
	IsLunarDate     bool    `json:"is_lunar_date"`
	IsAutoRenewal   bool    `json:"is_auto_renewal"`
	RenewalCycle    string  `json:"renewal_cycle"`
	ReminderDays    int     `json:"reminder_days"`
	Price           float64 `json:"price"`
	Currency        string  `json:"currency"`
	IsActive        bool    `json:"is_active"`
	Notes           string  `json:"notes"`
	NotifyWebhook   bool    `json:"notify_webhook"`
	NotifyWechatBot bool    `json:"notify_wechat_bot"`
	NotifyEmail     bool    `json:"notify_email"`
	NotifyEmails    string  `json:"notify_emails"`
}

func (dto *SubscriptionDTO) ToModel() (*Subscription, error) {
	startDate, err := parseDate(dto.StartDate)
	if err != nil {
		return nil, errors.New("invalid start_date format")
	}

	endDate, err := parseDate(dto.EndDate)
	if err != nil {
		return nil, errors.New("invalid end_date format")
	}

	return &Subscription{
		ID:              dto.ID,
		Name:            dto.Name,
		ServiceType:     dto.ServiceType,
		StartDate:       startDate,
		EndDate:         endDate,
		IsLunarDate:     dto.IsLunarDate,
		IsAutoRenewal:   dto.IsAutoRenewal,
		RenewalCycle:    dto.RenewalCycle,
		ReminderDays:    dto.ReminderDays,
		Price:           dto.Price,
		Currency:        dto.Currency,
		IsActive:        dto.IsActive,
		Notes:           dto.Notes,
		NotifyWebhook:   dto.NotifyWebhook,
		NotifyWechatBot: dto.NotifyWechatBot,
		NotifyEmail:     dto.NotifyEmail,
		NotifyEmails:    dto.NotifyEmails,
	}, nil
}

func parseDate(dateStr string) (time.Time, error) {
	formats := []string{
		"2006-01-02",
		"2006-01-02T15:04:05",
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.ParseInLocation(format, dateStr, time.Local); err == nil {
			return t, nil
		}
	}

	return time.Time{}, errors.New("unable to parse date")
}

type NotificationLog struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	SubscriptionID uint      `json:"subscription_id" gorm:"not null;index"`
	NotifyType     string    `json:"notify_type" gorm:"type:varchar(20)"`
	Message        string    `json:"message" gorm:"type:text"`
	IsSuccess      bool      `json:"is_success" gorm:"default:false"`
	ErrorMsg       string    `json:"error_msg" gorm:"type:text"`
	CreatedAt      time.Time `json:"created_at"`
}

type NotificationConfig struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	WebhookURL      string    `json:"webhook_url" gorm:"type:varchar(500)"`
	WebhookMethod   string    `json:"webhook_method" gorm:"type:varchar(10);default:'POST'"`
	WebhookHeaders  string    `json:"webhook_headers" gorm:"type:text"`
	WechatBotURL    string    `json:"wechat_bot_url" gorm:"type:varchar(500)"`
	EmailRecipients string    `json:"email_recipients" gorm:"type:varchar(500)"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type LunarInfo struct {
	Year        int    `json:"year"`
	Month       int    `json:"month"`
	Day         int    `json:"day"`
	IsLeapMonth bool   `json:"is_leap_month"`
	GanZhiYear  string `json:"gan_zhi_year"`
	ShengXiao   string `json:"sheng_xiao"`
	MonthName   string `json:"month_name"`
	DayName     string `json:"day_name"`
}

type SubscriptionStats struct {
	Total          int `json:"total"`
	Active         int `json:"active"`
	Inactive       int `json:"inactive"`
	ExpiringSoon   int `json:"expiring_soon"`
	Expired        int `json:"expired"`
}
