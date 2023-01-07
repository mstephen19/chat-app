package db

import (
	"context"
	"errors"

	"github.com/go-redis/redis/v9"
)

const PONG = "PONG"

func ConnectRedis() (rdb *redis.Client, err error) {
	rdb = redis.NewClient(&redis.Options{
		// In development, connect via the network
		// with the container name.
		Addr:     "redis:6379",
		Password: "",
		DB:       0,
	})

	status := rdb.Ping(context.TODO())

	if status.Val() != PONG {
		err = errors.New("failed to connect to redis")
	}

	return
}
