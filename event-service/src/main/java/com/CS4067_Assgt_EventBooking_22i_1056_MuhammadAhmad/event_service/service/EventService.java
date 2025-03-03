package com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.service;

import com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.model.Event;
import com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public List<Event> findAllEvents() {
        return eventRepository.findAll();
    }

    public Optional<Event> findEventById(String id) {
        return eventRepository.findById(id);
    }

    public Event saveEvent(Event event) {
        return eventRepository.save(event);
    }

    public void deleteEvent(String id) {
        eventRepository.deleteById(id);
    }
}