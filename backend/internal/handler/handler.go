package handler

import (
	"net/http"
	"strconv"
	"time"

	"subsTracker/internal/lunar"
	"subsTracker/internal/model"
	"subsTracker/internal/repository"
	"subsTracker/internal/service"

	"github.com/gin-gonic/gin"
)

type SubscriptionHandler struct {
	subService service.SubscriptionService
	notifyService service.NotificationService
}

func NewSubscriptionHandler(subService service.SubscriptionService, notifyService service.NotificationService) *SubscriptionHandler {
	return &SubscriptionHandler{
		subService:    subService,
		notifyService: notifyService,
	}
}

func (h *SubscriptionHandler) Create(c *gin.Context) {
	var dto model.SubscriptionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if dto.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	sub, err := dto.ToModel()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	today := time.Now().Truncate(24 * time.Hour)
	endDate := sub.EndDate.Truncate(24 * time.Hour)
	if endDate.Before(today) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end date cannot be in the past"})
		return
	}

	if err := h.subService.Create(sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sub)
}

func (h *SubscriptionHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existing, err := h.subService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "subscription not found"})
		return
	}

	var dto model.SubscriptionDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dto.ID = uint(id)

	sub, err := dto.ToModel()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub.ID = existing.ID
	sub.CreatedAt = existing.CreatedAt

	if err := h.subService.Update(sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sub)
}

func (h *SubscriptionHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.subService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}

func (h *SubscriptionHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	sub, err := h.subService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "subscription not found"})
		return
	}

	result := gin.H{"subscription": sub}

	showLunar := c.Query("show_lunar") == "true"
	if showLunar && !sub.IsLunarDate {
		startLunar, _ := h.subService.GetLunarInfo(sub.StartDate)
		endLunar, _ := h.subService.GetLunarInfo(sub.EndDate)
		result["start_date_lunar"] = startLunar
		result["end_date_lunar"] = endLunar
	}

	c.JSON(http.StatusOK, result)
}

func (h *SubscriptionHandler) GetAll(c *gin.Context) {
	activeOnly := c.Query("active") == "true"
	
	subs, err := h.subService.GetAll(activeOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	showLunar := c.Query("show_lunar") == "true"
	
	type SubWithLunar struct {
		model.Subscription
		StartDateLunar map[string]interface{} `json:"start_date_lunar,omitempty"`
		EndDateLunar   map[string]interface{} `json:"end_date_lunar,omitempty"`
	}

	result := make([]SubWithLunar, len(subs))
	for i, sub := range subs {
		result[i].Subscription = sub
		if showLunar && !sub.IsLunarDate {
			startLunar, _ := h.subService.GetLunarInfo(sub.StartDate)
			endLunar, _ := h.subService.GetLunarInfo(sub.EndDate)
			result[i].StartDateLunar = startLunar
			result[i].EndDateLunar = endLunar
		}
	}

	c.JSON(http.StatusOK, result)
}

func (h *SubscriptionHandler) ToggleActive(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.subService.ToggleActive(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sub, _ := h.subService.GetByID(uint(id))
	c.JSON(http.StatusOK, sub)
}

func (h *SubscriptionHandler) GetExpiringSoon(c *gin.Context) {
	subs, err := h.subService.GetExpiringSoon()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subs)
}

func (h *SubscriptionHandler) GetExpired(c *gin.Context) {
	subs, err := h.subService.GetExpired()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, subs)
}

func (h *SubscriptionHandler) GetStats(c *gin.Context) {
	stats, err := h.subService.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

type LunarHandler struct {
}

func NewLunarHandler() *LunarHandler {
	return &LunarHandler{}
}

func (h *LunarHandler) GetLunarInfo(c *gin.Context) {
	dateStr := c.Query("date")
	var date time.Time
	var err error

	if dateStr == "" {
		date = time.Now()
	} else {
		date, err = time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
			return
		}
	}

	info, err := lunar.GetLunarInfo(date.Year(), int(date.Month()), date.Day())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, info)
}

func (h *LunarHandler) LunarToSolar(c *gin.Context) {
	var req struct {
		Year        int  `json:"year" binding:"required"`
		Month       int  `json:"month" binding:"required"`
		Day         int  `json:"day" binding:"required"`
		IsLeapMonth bool `json:"is_leap_month"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	solar, err := lunar.ConvertLunarToSolar(req.Year, req.Month, req.Day, req.IsLeapMonth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, solar)
}

type NotificationConfigHandler struct {
	configRepo repository.NotificationConfigRepository
}

func NewNotificationConfigHandler(configRepo repository.NotificationConfigRepository) *NotificationConfigHandler {
	return &NotificationConfigHandler{configRepo: configRepo}
}

func (h *NotificationConfigHandler) Get(c *gin.Context) {
	config, err := h.configRepo.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, config)
}

func (h *NotificationConfigHandler) Update(c *gin.Context) {
	existing, err := h.configRepo.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var config model.NotificationConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.ID = existing.ID
	config.UpdatedAt = time.Now()

	if err := h.configRepo.Save(&config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

type TestNotificationHandler struct {
	notifyService service.NotificationService
	subService    service.SubscriptionService
}

func NewTestNotificationHandler(notifyService service.NotificationService, subService service.SubscriptionService) *TestNotificationHandler {
	return &TestNotificationHandler{
		notifyService: notifyService,
		subService:    subService,
	}
}

func (h *TestNotificationHandler) TestWebhook(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Message string `json:"message"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	testSub := &model.Subscription{
		ID:           0,
		Name:         "测试订阅",
		ServiceType:  "测试",
		EndDate:      time.Now().AddDate(0, 0, 7),
		Price:        99.99,
		Currency:     "CNY",
	}

	if err := h.notifyService.SendWebhook(testSub, req.Title, req.Message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "webhook sent successfully"})
}

func (h *TestNotificationHandler) TestWechatBot(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Message string `json:"message"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	testSub := &model.Subscription{
		ID:           0,
		Name:         "测试订阅",
		ServiceType:  "测试",
		EndDate:      time.Now().AddDate(0, 0, 7),
		Price:        99.99,
		Currency:     "CNY",
	}

	if err := h.notifyService.SendWechatBot(testSub, req.Title, req.Message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "wechat bot message sent successfully"})
}

func (h *TestNotificationHandler) TestEmail(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Message string `json:"message"`
		Email   string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	testSub := &model.Subscription{
		ID:           0,
		Name:         "测试订阅",
		ServiceType:  "测试",
		EndDate:      time.Now().AddDate(0, 0, 7),
		Price:        99.99,
		Currency:     "CNY",
		NotifyEmails: req.Email,
	}

	if err := h.notifyService.SendEmail(testSub, req.Title, req.Message); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "email sent successfully"})
}
