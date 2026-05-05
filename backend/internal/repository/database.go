package repository

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"subsTracker/config"
	"subsTracker/internal/model"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	dbPath := config.AppConfig.DBPath
	
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create database directory: %w", err)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}
	
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	if err := migrate(); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	if err := initDefaultData(); err != nil {
		return nil, fmt.Errorf("failed to init default data: %w", err)
	}

	return DB, nil
}

func migrate() error {
	err := DB.AutoMigrate(
		&model.Subscription{},
		&model.NotificationLog{},
		&model.NotificationConfig{},
	)
	if err != nil {
		return err
	}
	return nil
}

func initDefaultData() error {
	var count int64
	DB.Model(&model.NotificationConfig{}).Count(&count)
	
	if count == 0 {
		config := &model.NotificationConfig{
			WebhookMethod: "POST",
		}
		if err := DB.Create(config).Error; err != nil {
			return err
		}
	}
	
	return nil
}
