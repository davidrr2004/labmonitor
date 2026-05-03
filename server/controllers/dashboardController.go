package controllers

import (
	"time"

	"github.com/Frhnmj2004/LabMonitoring-server/config"
	"github.com/Frhnmj2004/LabMonitoring-server/models"
	"github.com/Frhnmj2004/LabMonitoring-server/utils"
	"github.com/gofiber/fiber/v2"
)

func GetDashboardSummary(c *fiber.Ctx) error {
	var totalSystems int64
	if err := config.DB.Model(&models.Computer{}).Count(&totalSystems).Error; err != nil {
		utils.LogError("Failed to count systems: %v", err)
	}

	// Count online systems (seen within last 5 minutes)
	var onlineSystems int64
	fiveMinAgo := time.Now().Add(-5 * time.Minute)
	if err := config.DB.Model(&models.Computer{}).Where("last_seen >= ?", fiveMinAgo).Count(&onlineSystems).Error; err != nil {
		utils.LogError("Failed to count online systems: %v", err)
	}

	// Get average CPU and memory from recent resource logs (last 5 minutes)
	type AvgMetrics struct {
		AvgCPU    float64 `json:"avg_cpu"`
		AvgMemory float64 `json:"avg_memory"`
	}
	var avg AvgMetrics
	config.DB.Model(&models.ResourceLog{}).
		Where("timestamp >= ?", fiveMinAgo).
		Select("COALESCE(AVG(cpu), 0) as avg_cpu, COALESCE(AVG(memory), 0) as avg_memory").
		Scan(&avg)

	// Get active alerts count
	var activeAlerts int64
	config.DB.Model(&models.Alert{}).Where("resolved = ?", false).Count(&activeAlerts)

	// Get recent alerts
	var recentAlerts []models.Alert
	config.DB.Where("resolved = ?", false).Order("timestamp desc").Limit(5).Find(&recentAlerts)

	return c.JSON(fiber.Map{
		"total_systems":  totalSystems,
		"online_systems": onlineSystems,
		"avg_cpu":        avg.AvgCPU,
		"avg_memory":     avg.AvgMemory,
		"active_alerts":  activeAlerts,
		"recent_alerts":  recentAlerts,
	})
}
