// src/main/java/com/example/events/repository/EventRepository.java
package com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.repository;

import com.CS4067_Assgt_EventBooking_22i_1056_MuhammadAhmad.event_service.model.Event;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {
    // You can add custom query methods here if needed
}