package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"time"

	"github.com/joho/godotenv" // Added for .env loading
	"github.com/rabbitmq/amqp091-go"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// BookingNotification represents the structure of the message from RabbitMQ
type BookingNotification struct {
	BookingID int    `json:"bookingId"`
	EventID   string `json:"eventId"`
	UserEmail string `json:"userEmail"`
}

// EmailConfig holds SMTP configuration (not used with Gmail API, but kept for reference)
type EmailConfig struct {
	From     string
	Password string
	Host     string
	Port     string
}

// getClient retrieves an OAuth2 client using credentials and token files
func getClient(ctx context.Context) (*http.Client, error) {
	// Load environment variables from .env file
	err := godotenv.Load("../.env") // Try loading from project root (adjust if needed)
	if err != nil {
		log.Printf("Warning: .env file not found, using system environment variables: %v", err)
	}
	// Load credentials from environment variable or file
	credPath := os.Getenv("GOOGLE_CREDENTIALS_PATH")
	if credPath == "" {
		return nil, fmt.Errorf("GOOGLE_CREDENTIALS_PATH environment variable is not set")
	}
	credPath, err = filepath.Abs(credPath)
	if err != nil {
		return nil, fmt.Errorf("unable to resolve credentials path: %v", err)
	}
	log.Printf("Attempting to read credentials from: %s", credPath)
	b, err := os.ReadFile(credPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read client secret file at %s: %v", credPath, err)
	}
	config, err := google.ConfigFromJSON(b, gmail.GmailSendScope)
	if err != nil {
		return nil, fmt.Errorf("unable to parse client secret file to config: %v", err)
	}
	// Load or create token
	tokenPath := os.Getenv("GOOGLE_TOKEN_PATH")
	if tokenPath == "" {
		return nil, fmt.Errorf("GOOGLE_TOKEN_PATH environment variable is not set")
	}
	tokenPath, err = filepath.Abs(tokenPath)
	if err != nil {
		return nil, fmt.Errorf("unable to resolve token path: %v", err)
	}
	log.Printf("Attempting to read token from: %s", tokenPath)
	token, err := tokenFromFile(tokenPath)
	if err != nil {
		log.Printf("Token file not found or invalid, initiating OAuth flow: %v", err)
		token, err = getTokenFromWeb(config)
		if err != nil {
			return nil, err
		}
		saveToken(tokenPath, token)
		log.Printf("New token saved to: %s", tokenPath)
	}
	return config.Client(ctx, token), nil
}

// getClient retrieves an OAuth2 client using credentials from environment variables
func getClientFromEnv(ctx context.Context) (*http.Client, error) {
	// Load environment variables from .env file
	err := godotenv.Load("../.env")
	if err != nil {
		log.Printf("Warning: .env file not found, using system environment variables: %v", err)
	}

	// Read credentials and token directly from environment variables
	credentialsJSON := os.Getenv("GOOGLE_CREDENTIALS_JSON")
	if credentialsJSON == "" {
		return nil, fmt.Errorf("GOOGLE_CREDENTIALS_JSON environment variable is not set")
	}

	// Parse credentials from JSON string
	config, err := google.ConfigFromJSON([]byte(credentialsJSON), gmail.GmailSendScope)
	if err != nil {
		return nil, fmt.Errorf("unable to parse client secret JSON to config: %v", err)
	}

	// Read token from environment variable
	tokenJSON := os.Getenv("GOOGLE_TOKEN_JSON")
	if tokenJSON == "" {
		log.Printf("Token not found in environment, initiating OAuth flow")
		// Perform OAuth flow to get new token
		token, err := getTokenFromWebFromEnv(config)
		if err != nil {
			return nil, err
		}
		// Convert token to JSON string and log for user to save in .env
		tokenBytes, _ := json.Marshal(token)
		log.Printf("New token JSON (save this in your .env):\nGOOGLE_TOKEN_JSON='%s'", string(tokenBytes))
		return config.Client(ctx, token), nil
	}

	// Parse token from JSON string
	tok := &oauth2.Token{}
	err = json.Unmarshal([]byte(tokenJSON), tok)
	if err != nil {
		return nil, fmt.Errorf("unable to decode token from environment variable: %v", err)
	}

	return config.Client(ctx, tok), nil
}

// tokenFromFile reads a token from a file
func tokenFromFile(file string) (*oauth2.Token, error) {
	log.Printf("Reading token file: %s", file)
	f, err := os.Open(file)
	if err != nil {
		return nil, fmt.Errorf("unable to open token file %s: %v", file, err)
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	if err != nil {
		return nil, fmt.Errorf("unable to decode token file %s: %v", file, err)
	}
	log.Printf("Token loaded successfully from %s", file)
	return tok, nil
}

// getTokenFromWeb uses the OAuth2 flow to get a token with an HTTP server on port 8085
func getTokenFromWeb(config *oauth2.Config) (*oauth2.Token, error) {
	// Define redirect URI (port 8085 as specified)
	const redirectURL = "http://localhost:8085/callback"
	config.RedirectURL = redirectURL
	// State token to prevent CSRF
	state := "state-token"
	// Start an HTTP server on port 8085 to handle the callback
	var tokenChan = make(chan *oauth2.Token, 1)
	var errChan = make(chan error, 1)
	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		code := query.Get("code")
		if code == "" {
			errChan <- fmt.Errorf("no authorization code provided")
			return
		}
		log.Printf("Received OAuth callback with code: %s", code)
		tok, err := config.Exchange(context.Background(), code)
		if err != nil {
			errChan <- fmt.Errorf("unable to exchange token: %v", err)
			return
		}
		log.Printf("Token exchanged successfully: %v", tok)
		tokenChan <- tok
		fmt.Fprintf(w, "<html><body>Authorization successful! You can close this window.</body></html>")
	})
	go func() {
		log.Println("Starting OAuth callback server on :8085...")
		if err := http.ListenAndServe(":8085", nil); err != http.ErrServerClosed {
			errChan <- fmt.Errorf("callback server failed: %v", err)
		}
	}()
	// Generate auth URL
	authURL := config.AuthCodeURL(state)
	log.Printf("Generated OAuth URL: %s", authURL)
	fmt.Printf("Go to the following URL in your browser to authorize: %v\n", authURL)
	// Wait for the token or error
	select {
	case token := <-tokenChan:
		log.Printf("Received token from callback: %v", token)
		return token, nil
	case err := <-errChan:
		log.Printf("Error during OAuth flow: %v", err)
		return nil, err
	case <-time.After(5 * time.Minute): // Timeout if no response
		log.Printf("OAuth flow timed out after 5 minutes")
		return nil, fmt.Errorf("authorization timeout")
	}
}

// getTokenFromWeb uses the OAuth2 flow to get a token with an HTTP server on port 8085
func getTokenFromWebFromEnv(config *oauth2.Config) (*oauth2.Token, error) {
	// Define redirect URI (port 8085 as specified)
	const redirectURL = "http://localhost:8085/callback"
	config.RedirectURL = redirectURL
	// State token to prevent CSRF
	state := "state-token"
	// Start an HTTP server on port 8085 to handle the callback
	var tokenChan = make(chan *oauth2.Token, 1)
	var errChan = make(chan error, 1)
	http.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		code := query.Get("code")
		if code == "" {
			errChan <- fmt.Errorf("no authorization code provided")
			return
		}
		log.Printf("Received OAuth callback with code: %s", code)
		tok, err := config.Exchange(context.Background(), code)
		if err != nil {
			errChan <- fmt.Errorf("unable to exchange token: %v", err)
			return
		}
		log.Printf("Token exchanged successfully: %v", tok)
		tokenChan <- tok
		fmt.Fprintf(w, "<html><body>Authorization successful! You can close this window.</body></html>")
	})
	go func() {
		log.Println("Starting OAuth callback server on :8085...")
		if err := http.ListenAndServe(":8085", nil); err != http.ErrServerClosed {
			errChan <- fmt.Errorf("callback server failed: %v", err)
		}
	}()
	// Generate auth URL
	authURL := config.AuthCodeURL(state)
	log.Printf("Generated OAuth URL: %s", authURL)
	fmt.Printf("Go to the following URL in your browser to authorize: %v\n", authURL)
	// Wait for the token or error
	select {
	case token := <-tokenChan:
		log.Printf("Received token from callback: %v", token)
		return token, nil
	case err := <-errChan:
		log.Printf("Error during OAuth flow: %v", err)
		return nil, err
	case <-time.After(5 * time.Minute): // Timeout if no response
		log.Printf("OAuth flow timed out after 5 minutes")
		return nil, fmt.Errorf("authorization timeout")
	}
}

// saveToken saves the token to a file
func saveToken(path string, token *oauth2.Token) {
	path, err := filepath.Abs(path)
	if err != nil {
		log.Fatalf("Unable to resolve token path: %v", err)
	}
	log.Printf("Saving token to: %s", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token at %s: %v", path, err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
	log.Printf("Token saved successfully to %s", path)
}

// sendEmail sends a notification email using Gmail API
func sendEmail(srv *gmail.Service, to, subject, body string) error {
	log.Printf("Attempting to send email to: %s", to)
	if !isValidEmail(to) {
		log.Printf("Invalid email address detected: %s", to)
		return fmt.Errorf("invalid email address: %s", to)
	}

	// Create the message with proper headers
	var message gmail.Message

	// Format the email with proper headers
	// The format needs to follow RFC 5322 with proper headers
	emailContent := []byte(fmt.Sprintf("From: me\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n"+
		"%s", to, subject, body))

	// Gmail API requires base64url encoding
	message.Raw = base64.URLEncoding.EncodeToString(emailContent)

	log.Printf("Sending email via Gmail API to %s", to)
	_, err := srv.Users.Messages.Send("me", &message).Do()
	if err != nil {
		log.Printf("Failed to send email to %s: %v", to, err)
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("Successfully sent email to %s", to)
	return nil
}

// isValidEmail checks if an email address is valid (basic regex)
func isValidEmail(email string) bool {
	emailRegex := `^[^\s@]+@[^\s@]+\.[^\s@]+$`
	match, _ := regexp.MatchString(emailRegex, email)
	return match
}

// main function
func main() {
	// Load environment variables from .env file
	err := godotenv.Load(".env") // Try loading from project root (adjust if needed)
	if err != nil {
		log.Printf("Warning: .env file not found, using system environment variables: %v", err)
	}

	// Load environment variables
	rabbitMQURL := os.Getenv("RABBITMQ_URL")
	if rabbitMQURL == "" {
		log.Fatal("RABBITMQ_URL environment variable is not set")
	}
	log.Printf("Starting application with RABBITMQ_URL: %s", rabbitMQURL)

	// Get queue name from environment variable, with a default fallback
	queueName := os.Getenv("RABBITMQ_QUEUE_NAME")
	if queueName == "" {
		queueName = "booking_notifications" // Default queue name
		log.Printf("RABBITMQ_QUEUE_NAME not set, using default: %s", queueName)
	}
	log.Printf("Starting application with RABBITMQ_URL: %s, Queue: %s", rabbitMQURL, queueName)

	// Set up context
	ctx := context.Background()

	// Get Gmail API client
	log.Printf("Initializing Gmail API client...")
	client, err := getClientFromEnv(ctx)
	if err != nil {
		log.Fatalf("Failed to get Gmail client: %v", err)
	}
	log.Printf("Creating Gmail service...")

	srv, err := gmail.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		log.Fatalf("Failed to create Gmail service: %v", err)
	}

	// Connect to RabbitMQ
	log.Printf("Connecting to RabbitMQ at %s...", rabbitMQURL)
	conn, err := amqp091.Dial(rabbitMQURL)
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	log.Printf("Opening RabbitMQ channel...")
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %v", err)
	}
	defer ch.Close()

	// Declare the queue
	log.Printf("Declaring queue '%s'...", queueName)
	queue, err := ch.QueueDeclare(
		queueName, // queue name
		true,      // durable
		false,     // auto-delete
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}
	log.Printf("Queue '%s' declared with %d messages", queueName, queue.Messages)

	// Start consuming messages
	log.Printf("Starting to consume messages from queue '%s'...", queueName)
	msgs, err := ch.Consume(
		queue.Name, // queue
		"",         // consumer
		true,       // auto-ack
		false,      // exclusive
		false,      // no-local
		false,      // no-wait
		nil,        // args
	)
	if err != nil {
		log.Fatalf("Failed to register a consumer: %v", err)
	}
	log.Println("Waiting for messages. To exit press CTRL+C")
	// Consume messages in a goroutine
	go func() {
		for msg := range msgs {
			log.Printf("Received message: %s", string(msg.Body))
			// Fixed: Allocate the variable properly before unmarshaling
			var notification BookingNotification
			err := json.Unmarshal(msg.Body, &notification)
			if err != nil {
				log.Printf("Failed to unmarshal message: %v, Raw message: %s", err, string(msg.Body))
				continue
			}
			log.Printf("Unmarshaled notification: %+v", notification)
			// Send email notification
			subject := fmt.Sprintf("Booking Confirmation for Event %s", notification.EventID)
			body := fmt.Sprintf(`
Dear User,

Your registration for Event %s (Booking ID: %d) was successful!

Thank you for booking with us. If you have any questions, feel free to contact us.

Best regards,
Your Event Booking Team
`, notification.EventID, notification.BookingID)
			log.Printf("Attempting to send email to: %s with subject: %s", notification.UserEmail, subject)
			err = sendEmail(srv, notification.UserEmail, subject, body)
			if err != nil {
				log.Printf("Failed to send email to %s: %v", notification.UserEmail, err)
			} else {
				log.Printf("Successfully sent email notification for booking %d", notification.BookingID)
			}
		}
	}()
	// Keep the application running
	forever := make(chan bool)
	<-forever
}
