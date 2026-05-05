package controllers

import (
	"time"

	"github.com/Frhnmj2004/LabMonitoring-server/config"
	"github.com/Frhnmj2004/LabMonitoring-server/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AppUsageEntryRequest struct {
	Name     string  `json:"name"`
	PID      int     `json:"pid"`
	CPU      float64 `json:"cpu"`
	MemoryMB float64 `json:"memory_mb"`
	Username string  `json:"username"`
}

type AppUsageSnapshotRequest struct {
	SystemID   string                 `json:"system_id"`
	CommandID  string                 `json:"command_id"`
	CapturedAt time.Time              `json:"captured_at"`
	Processes  []AppUsageEntryRequest `json:"processes"`
}

// PostAppUsageSnapshot saves a process snapshot from the agent and marks the
// originating command as done.
// POST /api/v1/app-usage
func PostAppUsageSnapshot(c *fiber.Ctx) error {
	var req AppUsageSnapshotRequest
	if err := c.BodyParser(&req); err != nil || req.SystemID == "" || req.CommandID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body — system_id and command_id are required",
		})
	}

	cmdUUID, err := uuid.Parse(req.CommandID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid command_id format",
		})
	}

	snapshot := &models.AppUsageSnapshot{
		SystemID:   req.SystemID,
		CommandID:  cmdUUID,
		CapturedAt: req.CapturedAt,
	}
	if req.CapturedAt.IsZero() {
		snapshot.CapturedAt = time.Now()
	}

	if err := config.DB.Create(snapshot).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save snapshot",
		})
	}

	// Bulk-insert process entries
	entries := make([]models.AppUsageEntry, 0, len(req.Processes))
	for _, p := range req.Processes {
		entries = append(entries, models.AppUsageEntry{
			SnapshotID: snapshot.ID,
			Name:       p.Name,
			PID:        p.PID,
			CPU:        p.CPU,
			MemoryMB:   p.MemoryMB,
			Username:   p.Username,
		})
	}
	if len(entries) > 0 {
		if err := config.DB.Create(&entries).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to save process entries",
			})
		}
	}

	// Mark the originating command as done
	now := time.Now()
	config.DB.Model(&models.Command{}).
		Where("id = ?", cmdUUID).
		Updates(map[string]any{"status": "done", "completed_at": now})

	return c.JSON(fiber.Map{"snapshot_id": snapshot.ID})
}

// GetLatestAppUsage returns the most recent process snapshot for a system.
// GET /api/v1/app-usage/latest?system_id=...
func GetLatestAppUsage(c *fiber.Ctx) error {
	systemID := c.Query("system_id")
	if systemID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "system_id query parameter is required",
		})
	}

	var snapshot models.AppUsageSnapshot
	if err := config.DB.
		Where("system_id = ?", systemID).
		Order("captured_at desc").
		First(&snapshot).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "No snapshots found for this system",
		})
	}

	var entries []models.AppUsageEntry
	config.DB.Where("snapshot_id = ?", snapshot.ID).
		Order("cpu desc").
		Find(&entries)

	return c.JSON(fiber.Map{
		"snapshot": snapshot,
		"entries":  entries,
	})
}
