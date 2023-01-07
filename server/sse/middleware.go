package see

import (
	"github.com/gin-gonic/gin"
)

type DisconnectionChannel chan int

const DisconnectionChannelKey = "IsDisconnected"
const CodeDisconnect = 1

// Sends client headers necessary for streaming events.
func PrepareSSE(ctx *gin.Context) {
	// Set necessary headers for server side events
	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("Transfer-Encoding", "chunked")
	ctx.Header("Access-Control-Allow-Origin", "*")

	// Immediately send these headers to the client
	ctx.Writer.Flush()
	ctx.Next()
}

// Create a channel that is dedicated to receiving a message
// notifying that the client has disconnected. Creates a channel
// and attaches it to the context.
func CreateClientDisconnectionChannel(ctx *gin.Context) {
	disconnectionChannel := make(DisconnectionChannel)
	ctx.Set(DisconnectionChannelKey, disconnectionChannel)

	defer func() {
		disconnectionChannel <- CodeDisconnect
		close(disconnectionChannel)
	}()

	ctx.Next()
}
