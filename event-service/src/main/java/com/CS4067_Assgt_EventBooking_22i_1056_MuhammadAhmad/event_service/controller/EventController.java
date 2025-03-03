package com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.model.Event;
import com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.service.EventService;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*") // For development - restrict in production
public class EventController {

    @Autowired
    private EventService eventService;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        // Authentication is handled by the Python auth service
        List<Event> events = eventService.findAllEvents();
        return new ResponseEntity<>(events, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable String id) {
        return eventService.findEventById(id)
                .map(event -> new ResponseEntity<>(event, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        // The Event object now includes 'seats' in the JSON payload
        Event savedEvent = eventService.saveEvent(event);
        return new ResponseEntity<>(savedEvent, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable String id, @RequestBody Event event) {
        // The Event object now includes 'seats' in the JSON payload
        return eventService.findEventById(id)
                .map(existingEvent -> {
                    event.setId(id);
                    Event updatedEvent = eventService.saveEvent(event);
                    return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        return eventService.findEventById(id)
                .map(event -> {
                    eventService.deleteEvent(id);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * New endpoint to check available seats for an event
     */
    @GetMapping("/{id}/seats")
    public ResponseEntity<Integer> getAvailableSeats(@PathVariable String id) {
        return eventService.findEventById(id)
                .map(event -> new ResponseEntity<>(event.getSeats(), HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
}