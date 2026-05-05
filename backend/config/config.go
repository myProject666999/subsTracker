package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        int
	DBPath      string
	ResendAPIKey string
	ResendFrom   string
	GinMode     string
}

var AppConfig *Config

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	port := getEnvAsInt("PORT", 8080)
	dbPath := getEnv("DB_PATH", "./db/subsTracker.db")
	resendAPIKey := getEnv("RESEND_API_KEY", "")
	resendFrom := getEnv("RESEND_FROM", "no-reply@example.com")
	ginMode := getEnv("GIN_MODE", "debug")

	AppConfig = &Config{
		Port:         port,
		DBPath:       dbPath,
		ResendAPIKey: resendAPIKey,
		ResendFrom:   resendFrom,
		GinMode:      ginMode,
	}

	return AppConfig
}

func getEnv(key string, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
