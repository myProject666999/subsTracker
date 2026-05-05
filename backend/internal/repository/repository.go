package repository

import (
	"time"

	"subsTracker/internal/model"

	"gorm.io/gorm"
)

type SubscriptionRepository interface {
	Create(sub *model.Subscription) error
	Update(sub *model.Subscription) error
	Delete(id uint) error
	FindByID(id uint) (*model.Subscription, error)
	FindAll(activeOnly bool) ([]model.Subscription, error)
	FindExpiringSoon(days int) ([]model.Subscription, error)
	FindExpired() ([]model.Subscription, error)
	GetStats() (*model.SubscriptionStats, error)
}

type subscriptionRepository struct {
	db *gorm.DB
}

func NewSubscriptionRepository(db *gorm.DB) SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) Create(sub *model.Subscription) error {
	return r.db.Create(sub).Error
}

func (r *subscriptionRepository) Update(sub *model.Subscription) error {
	return r.db.Save(sub).Error
}

func (r *subscriptionRepository) Delete(id uint) error {
	return r.db.Delete(&model.Subscription{}, id).Error
}

func (r *subscriptionRepository) FindByID(id uint) (*model.Subscription, error) {
	var sub model.Subscription
	err := r.db.First(&sub, id).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *subscriptionRepository) FindAll(activeOnly bool) ([]model.Subscription, error) {
	var subs []model.Subscription
	query := r.db.Order("end_date ASC")
	
	if activeOnly {
		query = query.Where("is_active = ?", true)
	}
	
	err := query.Find(&subs).Error
	return subs, err
}

func (r *subscriptionRepository) FindExpiringSoon(days int) ([]model.Subscription, error) {
	var subs []model.Subscription
	now := time.Now()
	threshold := now.AddDate(0, 0, days)
	
	err := r.db.Where("is_active = ? AND end_date <= ? AND end_date >= ?", 
		true, threshold, now).
		Order("end_date ASC").
		Find(&subs).Error
	return subs, err
}

func (r *subscriptionRepository) FindExpired() ([]model.Subscription, error) {
	var subs []model.Subscription
	now := time.Now()
	
	err := r.db.Where("is_active = ? AND end_date < ?", true, now).
		Order("end_date ASC").
		Find(&subs).Error
	return subs, err
}

func (r *subscriptionRepository) GetStats() (*model.SubscriptionStats, error) {
	var stats model.SubscriptionStats
	
	var total int64
	var active int64
	var inactive int64
	var expiringSoon int64
	var expired int64
	
	r.db.Model(&model.Subscription{}).Count(&total)
	r.db.Model(&model.Subscription{}).Where("is_active = ?", true).Count(&active)
	r.db.Model(&model.Subscription{}).Where("is_active = ?", false).Count(&inactive)
	
	now := time.Now()
	sevenDaysLater := now.AddDate(0, 0, 7)
	
	r.db.Model(&model.Subscription{}).
		Where("is_active = ? AND end_date <= ? AND end_date >= ?", true, sevenDaysLater, now).
		Count(&expiringSoon)
	
	r.db.Model(&model.Subscription{}).
		Where("is_active = ? AND end_date < ?", true, now).
		Count(&expired)
	
	stats.Total = int(total)
	stats.Active = int(active)
	stats.Inactive = int(inactive)
	stats.ExpiringSoon = int(expiringSoon)
	stats.Expired = int(expired)
	
	return &stats, nil
}

type NotificationConfigRepository interface {
	Get() (*model.NotificationConfig, error)
	Save(config *model.NotificationConfig) error
}

type notificationConfigRepository struct {
	db *gorm.DB
}

func NewNotificationConfigRepository(db *gorm.DB) NotificationConfigRepository {
	return &notificationConfigRepository{db: db}
}

func (r *notificationConfigRepository) Get() (*model.NotificationConfig, error) {
	var config model.NotificationConfig
	err := r.db.First(&config).Error
	if err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *notificationConfigRepository) Save(config *model.NotificationConfig) error {
	return r.db.Save(config).Error
}

type NotificationLogRepository interface {
	Create(log *model.NotificationLog) error
	FindBySubscriptionID(subID uint) ([]model.NotificationLog, error)
}

type notificationLogRepository struct {
	db *gorm.DB
}

func NewNotificationLogRepository(db *gorm.DB) NotificationLogRepository {
	return &notificationLogRepository{db: db}
}

func (r *notificationLogRepository) Create(log *model.NotificationLog) error {
	return r.db.Create(log).Error
}

func (r *notificationLogRepository) FindBySubscriptionID(subID uint) ([]model.NotificationLog, error) {
	var logs []model.NotificationLog
	err := r.db.Where("subscription_id = ?", subID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}
