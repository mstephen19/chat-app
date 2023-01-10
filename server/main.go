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

type RoomEvent struct {
	RoomId string `json:"room_id"`
	Count  int64  `json:"user_count"`
}

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
	// Enable Redis keyspace events
	_, err = redisClient.Do(context.TODO(), "CONFIG", "SET", "notify-keyspace-events", "KEA").Result()
	if err != nil {
		panic(fmt.Sprintf("Unable to set keyspace events: %v\n", err.Error()))
	}

	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.Use(cors.New(cors.Config{
		AllowOrigins:           []string{"http://localhost:3000"},
		AllowCredentials:       true,
		AllowHeaders:           []string{"Content-Type"},
		AllowBrowserExtensions: true,
		AllowWildcard:          true,
	}))

	// Later on, create this route, which will stream events to the client
	router.GET("/rooms", utils.PrepareSSE, func(ctx *gin.Context) {
		// Respond back to the client immediately
		ctx.Writer.Flush()

		// Listen for changes on the Redis hash containing all the rooms and their
		// user counts.
		eventSubscriber := redisClient.PSubscribe(context.TODO(), "__keyevent@0__:incrby")

		ctx.Stream(func(w io.Writer) bool {
			select {
			case <-ctx.Request.Context().Done():
				return false
			case msg, ok := <-eventSubscriber.Channel():
				if !ok {
					return false
				}
				cmd := redisClient.Get(context.TODO(), msg.Payload)
				count, err := cmd.Int64()
				if err != nil {
					return false
				}

				encodedRoomEvent, err := json.Marshal(RoomEvent{
					RoomId: msg.Payload,
					Count:  count,
				})
				if err != nil {
					return false
				}

				ctx.SSEvent("message", string(encodedRoomEvent))
			}
			return true
		})
	})

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

		// Generate a session token based on the room ID.
		token, err := utils.NewSessionToken(roomId)
		if err != nil {
			ctx.SecureJSON(http.StatusInternalServerError, JsonMessage{
				Message: "Failed to connect.",
			})
			return
		}

		// Set the sessionID cookie, then finally respond back to the client.
		ctx.SetCookie("session_id", token, 14400, "/", "", true, true)
		ctx.Writer.Flush()

		// Once the request has completed, send a notification that the user
		// has left the chat.
		defer func() {
			leaveEvent, _ := json.Marshal(Message{
				Type:     UserLeaveEvent,
				SenderId: userId,
				Sender:   userName,
				Time:     time.Now().UnixMilli(),
			})

			redisClient.Publish(context.TODO(), roomId, leaveEvent)
			// Decrement the number of users in the room.
			redisClient.Decr(context.TODO(), roomId)
		}()
		// Run the joining logic as a goroutine as to not block the subscribing
		// to the stream.
		go func() {
			// Send a notification that the user has joined the chat
			joinEvent, _ := json.Marshal(Message{
				Type:     UserJoinEvent,
				SenderId: userId,
				Sender:   userName,
				Time:     time.Now().UnixMilli(),
			})
			redisClient.Publish(context.TODO(), roomId, joinEvent)
			// Increment the number of users in the room.
			redisClient.Incr(context.TODO(), roomId)
		}()

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

				ctx.SSEvent("message", message.Payload)
			}
			return true
		})
	})

	router.POST("/messages/:id", utils.LimitBodySize(1024), func(ctx *gin.Context) {
		// Get the room ID the message should be posted to.
		roomId, exists := ctx.Params.Get("id")
		if !exists {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Invalid room ID.",
			})
			return
		}

		// Check the session cookie to see if the roomId is a match or not.
		sessionIdCookie, err := ctx.Request.Cookie("session_id")
		if err != nil {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "No session found.",
			})
			return
		}
		// Ensure the roomId they are trying to send the message to matches that
		// of the one in their session token.
		decodedRoomId, err := utils.DecodeSessionToken(sessionIdCookie.Value)
		if err != nil || decodedRoomId != roomId {
			ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
				Message: "Not authorized to send messages in this room.",
			})
			return
		}

		data, err := io.ReadAll(ctx.Request.Body)
		if err != nil {
			// Handle cases where someone tried to send a massive message to the server.
			// The error will be EOF when the body is massive.
			if err == io.EOF {
				ctx.SecureJSON(http.StatusBadRequest, JsonMessage{
					Message: "Request body too large.",
				})
				return
			}
			ctx.SecureJSON(http.StatusInternalServerError, JsonMessage{
				Message: "Failed to read request body.",
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
