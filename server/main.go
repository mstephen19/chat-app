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
	db "github.com/mstephen19/chat-app-redis/db"
	utils "github.com/mstephen19/chat-app-redis/utils"
)

type Message struct {
	SenderId string `json:"sender_id"`
	Sender   string `json:"sender"`
	Message  string `json:"message"`
	Time     int64  `json:"time"`
}

type JsonMessage struct {
	Message string `json:"message"`
}

func main() {
	redisClient, err := db.ConnectRedis()
	if err != nil {
		panic(err)
	}

	router := gin.Default()
	router.Use(cors.Default())

	router.GET("/rooms/:id", utils.PrepareSSE, func(ctx *gin.Context) {
		// Grab the room ID from the params to be used later.
		roomId, exists := ctx.Params.Get("id")
		if !exists {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Room ID not found.",
			})
			return
		}

		// Subscribe to the Redis channel for the room's messages
		subscriber := redisClient.Subscribe(context.TODO(), roomId)

		// Start streaming events to the client.
		ctx.Stream(func(w io.Writer) bool {
			// On each iteration, block until either the request has
			// ended, or a message has been received on the subscriber
			// channel.
			select {
			// Client disconnected? End stream and unsubscribe.
			case <-ctx.Request.Context().Done():
				subscriber.Unsubscribe(context.TODO(), roomId)
				return false
			case message, ok := <-subscriber.Channel():
				// Channel closes, end stream and unsubscribe.
				if !ok {
					subscriber.Unsubscribe(context.TODO(), roomId)
					return false
				}

				// Otherwise, send the message.
				ctx.SSEvent("message", message.Payload)
			}
			return true
		})
	})

	router.POST("/messages/:id", utils.LimitBodySize(1024*2), func(ctx *gin.Context) {
		// Get the room ID the message should be posted to
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
				Message: "Invalid request body.",
			})
			return
		}
		message := &Message{}
		err = json.Unmarshal(data, message)
		if err != nil || message.Message == "" || message.Sender == "" || message.SenderId == "" {
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

		redisClient.Publish(context.TODO(), roomId, encoded)

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
