package db

import (
	"context"
	"fmt"

	"github.com/go-redis/redis/v9"
)

func IncrementOrSet(client *redis.Client, roomId string) {
	data := client.Get(context.TODO(), roomId)
	fmt.Println(data.Int64())
}

func Decrement(client *redis.Client, roomId string) {
	client.Decr(context.TODO(), roomId)
}
