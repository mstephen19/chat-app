package utils

import (
	"os"

	"github.com/golang-jwt/jwt/v4"
)

var SecretKey = func() []byte {
	envVar := os.Getenv("JWT_SECRET_KEY")
	if envVar == "" {
		return []byte("env-var-not-found")
	}

	return []byte(envVar)
}()
var SigningMethod = jwt.SigningMethodHS256

func NewSessionToken(roomId string) (str string, err error) {
	token := jwt.NewWithClaims(SigningMethod, jwt.MapClaims{
		"room_id": roomId,
	})

	str, err = token.SignedString(SecretKey)
	return
}

func DecodeSessionToken(token string) (roomId string, err error) {
	claims := jwt.MapClaims{}
	_, err = jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		return SecretKey, nil
	})

	roomId = claims["room_id"].(string)

	return
}
