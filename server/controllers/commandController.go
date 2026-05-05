package controllers

import (
	"github.com/Frhnmj2004/LabMonitoring-server/config"
	"github.com/Frhnmj2004/LabMonitoring-server/models"
	"github.com/gofiber/fiber/v2"
)

type CreateCommandRequest struct {
	SystemID string `json:"system_id"`
	Type     string `json:"type"`
}

// CreateCommand creates a new command for a system.
// POST /api/v1/commands
func CreateCommand(c *fiber.Ctx) error {
	var req CreateCommandRequest
	if err := c.BodyParser(&req); err != nil || req.SystemID == "" || req.Type == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body — system_id and type are required",
		})
	}

	cmd := &models.Command{
		SystemID: req.SystemID,
		Type:     req.Type,
		Status:   "queued",
	}
	if err := config.DB.Create(cmd).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create command",
		})
	}

	return c.JSON(fiber.Map{
		"command_id": cmd.ID,
		"status":     cmd.Status,
	})
}

// GetCommand returns a single command by ID.
// GET /api/v1/commands/:id
func GetCommand(c *fiber.Ctx) error {
	id := c.Params("id")
	var cmd models.Command
	if err := config.DB.First(&cmd, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Command not found",
		})
	}
	return c.JSON(cmd)
}

type PollCommandsRequest struct {
	SystemID string `json:"system_id"`
}

// PollCommands returns up to 5 queued commands for a system and marks them as sent.
// POST /api/v1/agent/commands/poll
func PollCommands(c *fiber.Ctx) error {
	var req PollCommandsRequest
	if err := c.BodyParser(&req); err != nil || req.SystemID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body — system_id is required",
		})
	}

	var cmds []models.Command
	if err := config.DB.
		Where("system_id = ? AND status = ?", req.SystemID, "queued").
		Order("created_at asc").
		Limit(5).
		Find(&cmds).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch commands",
		})
	}

	// Mark fetched commands as sent
	for _, cmd := range cmds {
		config.DB.Model(&models.Command{}).
			Where("id = ?", cmd.ID).
			Update("status", "sent")
	}

	return c.JSON(fiber.Map{"commands": cmds})
}
