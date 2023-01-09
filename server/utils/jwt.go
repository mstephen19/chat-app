package utils

import (
	"github.com/golang-jwt/jwt/v4"
)

var SecretKeyShouldBeInEnv = []byte("put-this-in-env-later")
var SigningMethod = jwt.SigningMethodHS256

func NewSessionToken(roomId string) (str string, err error) {
	token := jwt.NewWithClaims(SigningMethod, jwt.MapClaims{
		"room_id": roomId,
	})

	str, err = token.SignedString(SecretKeyShouldBeInEnv)
	return
}

func DecodeSessionToken(token string) (roomId string, err error) {
	claims := jwt.MapClaims{}
	_, err = jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		return SecretKeyShouldBeInEnv, nil
	})

	roomId = claims["room_id"].(string)

	return
}
