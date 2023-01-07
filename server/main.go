package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	redisLib "github.com/mstephen19/chat-app-redis/redis"
	sse "github.com/mstephen19/chat-app-redis/sse"
)

type Message struct {
	Message string `json:"message"`
	Time    int64  `json:"time"`
}

type JsonMessage struct {
	Message string `json:"message"`
}

func main() {
	// Connect to Redis
	rdb, err := redisLib.Connect()
	if err != nil {
		panic(err)
	}

	router := gin.Default()

	router.Use(cors.Default())

	router.GET("/rooms/:id", sse.PrepareSSE, sse.CreateClientDisconnectionChannel, func(ctx *gin.Context) {
		// Grab the room ID from the params to be used later.
		roomId, exists := ctx.Params.Get("id")
		if !exists {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Room ID not found.",
			})
			return
		}

		// Grab hold of the disconnection channel that will notify of disconnection.
		any, exists := ctx.Get(sse.DisconnectionChannelKey)
		if !exists {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Failed to connect client.",
			})
			return
		}
		disconnectionChannel, exists := any.(sse.DisconnectionChannel)
		if !exists {
			ctx.SecureJSON(http.StatusInternalServerError, JsonMessage{
				Message: "Failed to connect client.",
			})
			return
		}
		// Subscribe to the Redis channel for the room's messages
		subscriber := rdb.Subscribe(context.TODO(), roomId)

		// Start streaming events to the client
		ctx.Stream(func(w io.Writer) bool {
			select {
			// If we've disconnected, then stop the stream
			case msg, ok := <-disconnectionChannel:
				if !ok || msg == sse.CodeDisconnect {
					return false
				}
				// Otherwise, listen for messages on the Redis subscriber
			default:
				message, err := subscriber.ReceiveMessage(context.TODO())
				// If any errors occur, simply stop the stream.
				if err != nil {
					return false
				}
				ctx.SSEvent("message", message.Payload)
			}
			return true
		})
	})

	router.POST("/messages/:id", func(ctx *gin.Context) {
		roomId, exists := ctx.Params.Get("id")
		if !exists {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Room ID not found.",
			})
			return
		}

		data, err := io.ReadAll(ctx.Request.Body)
		if err != nil {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Invalid request body",
			})
			return
		}
		message := &Message{}
		err = json.Unmarshal(data, message)
		if err != nil || message.Message == "" {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Invalid request body.",
			})
			return
		}

		message.Time = time.Now().UnixMilli()

		encoded, err := json.Marshal(&message)
		if err != nil {
			ctx.SecureJSON(http.StatusInternalServerError, JsonMessage{
				Message: "Failed to encode data.",
			})
			return
		}

		rdb.Publish(context.TODO(), roomId, encoded)

		ctx.SecureJSON(http.StatusOK, JsonMessage{
			Message: fmt.Sprintf("Sent message to room: %s", roomId),
		})
	})

	router.NoRoute(func(ctx *gin.Context) {
		ctx.SecureJSON(http.StatusNotFound, JsonMessage{
			Message: "Unknown route reached.",
		})
	})

	router.Run(":3001")
}
