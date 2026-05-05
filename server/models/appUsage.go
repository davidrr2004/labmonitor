package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AppUsageSnapshot struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SystemID   string    `gorm:"not null;index" json:"system_id"`
	CommandID  uuid.UUID `gorm:"type:uuid;not null" json:"command_id"`
	CapturedAt time.Time `gorm:"not null" json:"captured_at"`
	Command    Command   `gorm:"foreignKey:CommandID" json:"command,omitempty"`
}

func (s *AppUsageSnapshot) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.CapturedAt.IsZero() {
		s.CapturedAt = time.Now()
	}
	return nil
}

type AppUsageEntry struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	SnapshotID uuid.UUID `gorm:"type:uuid;not null;index" json:"snapshot_id"`
	Name       string    `gorm:"not null" json:"name"`
	PID        int       `gorm:"not null" json:"pid"`
	CPU        float64   `gorm:"not null" json:"cpu"`
	MemoryMB   float64   `gorm:"not null" json:"memory_mb"`
	Username   string    `gorm:"" json:"username"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	Snapshot   AppUsageSnapshot `gorm:"foreignKey:SnapshotID" json:"snapshot,omitempty"`
}

func (e *AppUsageEntry) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}
