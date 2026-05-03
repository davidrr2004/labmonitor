package controllers

import (
	"math"
	"strconv"
	"time"

	"github.com/Frhnmj2004/LabMonitoring-server/config"
	"github.com/Frhnmj2004/LabMonitoring-server/models"
	"github.com/Frhnmj2004/LabMonitoring-server/storage"
	"github.com/Frhnmj2004/LabMonitoring-server/utils"
	"github.com/Frhnmj2004/LabMonitoring-server/websocket"
	"github.com/gofiber/fiber/v2"
)

type ResourceData struct {
	ComputerID string  `json:"computer_id"`
	CPU        float64 `json:"cpu"`
	Memory     float64 `json:"memory"`
	NetworkIn  float64 `json:"network_in"`
	NetworkOut float64 `json:"network_out"`
}

func PostResource(c *fiber.Ctx) error {
	var data ResourceData
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate data
	if data.CPU < 0 || data.CPU > 100 || data.Memory < 0 || data.Memory > 100 || data.NetworkIn < 0 || data.NetworkOut < 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid resource values",
		})
	}

	var computer models.Computer
	if err := config.DB.Where("computer_id = ?", data.ComputerID).First(&computer).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Computer not found",
		})
	}

	if err := computer.UpdateLastSeen(config.DB); err != nil {
		utils.LogError("Failed to update computer last seen: %v", err)
	}

	// Create resource log
	log := &models.ResourceLog{
		ComputerID: data.ComputerID,
		CPU:        data.CPU,
		Memory:     data.Memory,
		NetworkIn:  data.NetworkIn,
		NetworkOut: data.NetworkOut,
		Timestamp:  time.Now(),
	}

	// Try to save to database
	if err := config.DB.Create(log).Error; err != nil {
		// If database save fails, store in buffer
		utils.LogWarning("Failed to save to database, writing to buffer: %v", err)
		if bufferErr := storage.WriteBuffer(log); bufferErr != nil {
			utils.LogError("Failed to write to buffer: %v", bufferErr)
		}
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Service temporarily unavailable, data buffered",
		})
	}

	// Check for high CPU usage
	if data.CPU > 90 {
		alert := &models.Alert{
			ComputerID: data.ComputerID,
			Type:       "HIGH_CPU",
			Message:    "CPU usage exceeds 90%",
			Timestamp:  time.Now(),
			Resolved:   false,
		}
		if err := config.DB.Create(alert).Error; err != nil {
			utils.LogError("Failed to create CPU alert: %v", err)
		} else {
			websocket.BroadcastResourceUpdate(fiber.Map{
				"type": "alert",
				"data": alert,
			})
		}
	}

	// Check for high memory usage
	if data.Memory > 90 {
		alert := &models.Alert{
			ComputerID: data.ComputerID,
			Type:       "HIGH_MEMORY",
			Message:    "Memory usage exceeds 90%",
			Timestamp:  time.Now(),
			Resolved:   false,
		}
		if err := config.DB.Create(alert).Error; err != nil {
			utils.LogError("Failed to create memory alert: %v", err)
		} else {
			websocket.BroadcastResourceUpdate(fiber.Map{
				"type": "alert",
				"data": alert,
			})
		}
	}

	// Broadcast resource update
	websocket.BroadcastResourceUpdate(fiber.Map{
		"type": "resource_update",
		"data": log,
	})

	return c.Status(fiber.StatusOK).JSON(log)
}

func GetHistory(c *fiber.Ctx) error {
	computerID := c.Query("computer_id")

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 1000 {
		limit = 50
	}
	offset := (page - 1) * limit

	var logs []models.ResourceLog
	var total int64

	query := config.DB.Model(&models.ResourceLog{})
	if computerID != "" {
		query = query.Where("computer_id = ?", computerID)
	}

	if err := query.Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch resource logs",
		})
	}

	findQuery := config.DB.Order("timestamp desc").Offset(offset).Limit(limit)
	if computerID != "" {
		findQuery = findQuery.Where("computer_id = ?", computerID)
	}

	if err := findQuery.Find(&logs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch resource logs",
		})
	}

	return c.JSON(fiber.Map{
		"data": logs,
		"pagination": fiber.Map{
			"current_page": page,
			"total_pages":  (total + int64(limit) - 1) / int64(limit),
			"total_items":  total,
			"per_page":     limit,
		},
	})
}

// GetResourceSummary returns aggregate resource stats for the dashboard
func GetResourceSummary(c *fiber.Ctx) error {
	var computers []models.Computer
	if err := config.DB.Find(&computers).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch data",
		})
	}

	totalSystems := len(computers)
	var onlineCount int
	var totalCPU, totalMemory, totalNetIn, totalNetOut float64
	var latestResources []fiber.Map

	for _, comp := range computers {
		if !comp.IsOnline() {
			continue
		}
		onlineCount++

		var log models.ResourceLog
		if err := config.DB.Where("computer_id = ?", comp.ComputerID).
			Order("timestamp desc").First(&log).Error; err != nil {
			continue
		}

		totalCPU += log.CPU
		totalMemory += log.Memory
		totalNetIn += log.NetworkIn
		totalNetOut += log.NetworkOut

		latestResources = append(latestResources, fiber.Map{
			"computer_id": comp.ComputerID,
			"cpu":         log.CPU,
			"memory":      log.Memory,
			"network_in":  log.NetworkIn,
			"network_out": log.NetworkOut,
			"timestamp":   log.Timestamp,
		})
	}

	var avgCPU, avgMemory, avgNetwork float64
	if onlineCount > 0 {
		avgCPU = totalCPU / float64(onlineCount)
		avgMemory = totalMemory / float64(onlineCount)
		avgNetwork = (totalNetIn + totalNetOut) / float64(2*onlineCount)
	}

	return c.JSON(fiber.Map{
		"total_systems": totalSystems,
		"online_count":  onlineCount,
		"averages": fiber.Map{
			"cpu":     math.Round(avgCPU*100) / 100,
			"memory":  math.Round(avgMemory*100) / 100,
			"network": math.Round(avgNetwork*100) / 100,
		},
		"latest": latestResources,
	})
}
