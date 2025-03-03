package main

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockGmailService mocks the Gmail service
type MockGmailService struct {
	mock.Mock
}

func (m *MockGmailService) SendEmail(to, subject, body string) error {
	args := m.Called(to, subject, body)
	return args.Error(0)
}

func TestEmailService(t *testing.T) {
	mockGmail := new(MockGmailService)

	// Mock message from RabbitMQ
	notification := BookingNotification{
		BookingID: 123,
		EventID:   "EVT12345",
		UserEmail: "test@example.com",
	}
	msgBytes, _ := json.Marshal(notification)

	mockGmail.On("SendEmail", notification.UserEmail, mock.Anything, mock.Anything).Return(nil)

	// Simulate email sending
	var receivedNotification BookingNotification
	json.Unmarshal(msgBytes, &receivedNotification)

	subject := "Booking Confirmation for Event " + receivedNotification.EventID
	body := "Your registration for Event " + receivedNotification.EventID + " (Booking ID: " + string(rune(receivedNotification.BookingID)) + ") was successful!"

	err := mockGmail.SendEmail(receivedNotification.UserEmail, subject, body)

	assert.NoError(t, err)
	mockGmail.AssertCalled(t, "SendEmail", receivedNotification.UserEmail, mock.Anything, mock.Anything)
}
