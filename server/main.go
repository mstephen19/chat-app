package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	router.NoRoute(func(ctx *gin.Context) {
		ctx.Writer.Write([]byte("foo"))
	})

	router.Run(":3001")
}
