FROM golang:1.19

RUN go install github.com/mitranim/gow@latest

WORKDIR /usr/src/app

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . ./

EXPOSE 3001

CMD ["gow", "run", "main.go"]