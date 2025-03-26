# Use the official Golang image as base
FROM golang:1.24-alpine

# Set working directory
WORKDIR /app

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application files
COPY . .

# Build the Go binary
RUN go build -o main ./cmd/main.go

# Expose the application port
EXPOSE 8085

# Run the binary
CMD ["./main"]
