package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

// Message adalah format pesan WebSocket standar
type Message struct {
	Type     string          `json:"type"`
	FamilyID string          `json:"family_id"`
	Payload  json.RawMessage `json:"payload"`
}

// Client merepresentasikan satu koneksi WebSocket
type Client struct {
	FamilyID uuid.UUID
	UserID   uuid.UUID
	conn     *websocket.Conn
	send     chan []byte
}

// Hub mengelola semua koneksi WebSocket aktif
type Hub struct {
	mu      sync.RWMutex
	clients map[*Client]struct{}
}

var DefaultHub = NewHub()

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*Client]struct{}),
	}
}

func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = struct{}{}
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c)
	close(c.send)
}

// BroadcastToFamily — kirim pesan ke semua member dalam satu family
func (h *Hub) BroadcastToFamily(familyID uuid.UUID, msgType string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("ws: marshal error: %v", err)
		return
	}

	msg := Message{
		Type:     msgType,
		FamilyID: familyID.String(),
		Payload:  data,
	}
	raw, _ := json.Marshal(msg)

	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.clients {
		if client.FamilyID == familyID {
			select {
			case client.send <- raw:
			default:
				// channel penuh — skip
			}
		}
	}
}

// Handler — upgrade HTTP ke WebSocket dan mulai read/write loop
func Handler(hub *Hub) fiber.Handler {
	return websocket.New(func(conn *websocket.Conn) {
		userID, _ := conn.Locals("user_id").(uuid.UUID)
		familyID, _ := conn.Locals("family_id").(uuid.UUID)

		client := &Client{
			FamilyID: familyID,
			UserID:   userID,
			conn:     conn,
			send:     make(chan []byte, 64),
		}
		hub.Register(client)
		defer hub.Unregister(client)

		// Write goroutine
		go func() {
			for msg := range client.send {
				if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
					return
				}
			}
		}()

		// Read loop — baca pesan dari client (ping/pong)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	})
}
