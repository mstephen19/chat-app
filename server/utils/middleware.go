package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Sends the client the headers necessary for streaming events.
func PrepareSSE(ctx *gin.Context) {
	// Set necessary headers for server side events
	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("Transfer-Encoding", "chunked")

	ctx.Next()
}

func LimitBodySize(byteSize int64) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, byteSize)
		ctx.Next()
	}
}
