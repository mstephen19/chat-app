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

const (
	MessageEvent   = "message"
	UserJoinEvent  = "user_join"
	UserLeaveEvent = "user_leave"
)

type Message struct {
	Type     string `json:"message_type"`
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

		// Credentials must be provided in the query parameters when
		// making a request for an event stream.
		userId := ctx.Query("user_id")
		userName := ctx.Query("user_name")
		if userId == "" || userName == "" {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Invalid credentials.",
			})
			return
		}

		joinEvent, err := json.Marshal(Message{
			Type:     UserJoinEvent,
			SenderId: userId,
			Sender:   userName,
			Time:     time.Now().UnixMilli(),
		})
		if err != nil {
			ctx.SecureJSON(http.StatusInternalServerError, JsonMessage{
				Message: "Failed to connect.",
			})
			return
		}
		redisClient.Publish(context.TODO(), roomId, joinEvent)

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
				// ! This isn't working
				leaveEvent, _ := json.Marshal(Message{
					Type:     UserLeaveEvent,
					SenderId: userId,
					Sender:   userName,
					Time:     time.Now().UnixMilli(),
				})
				ctx.SSEvent("message", leaveEvent)
				return false
			case message, ok := <-subscriber.Channel():
				// Channel closes, end stream and unsubscribe.
				if !ok {
					subscriber.Unsubscribe(context.TODO(), roomId)
					// ! This isn't working
					leaveEvent, _ := json.Marshal(Message{
						Type:     UserLeaveEvent,
						SenderId: userId,
						Sender:   userName,
						Time:     time.Now().UnixMilli(),
					})
					ctx.SSEvent("message", leaveEvent)
					return false
				}

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
		message.Type = MessageEvent

		encoded, err := json.Marshal(&message)
		if err != nil {
			ctx.SecureJSON(http.StatusInternalServerError, JsonMessage{
				Message: "Failed to encode data.",
			})
			return
		}
		fmt.Println(string(encoded))

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
