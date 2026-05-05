package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Command struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SystemID    string     `gorm:"not null;index" json:"system_id"`
	Type        string     `gorm:"not null" json:"type"`
	Status      string     `gorm:"not null;default:queued" json:"status"`
	RequestedBy string     `gorm:"" json:"requested_by"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	CompletedAt *time.Time `gorm:"" json:"completed_at"`
}

func (c *Command) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.Status == "" {
		c.Status = "queued"
	}
	return nil
}
