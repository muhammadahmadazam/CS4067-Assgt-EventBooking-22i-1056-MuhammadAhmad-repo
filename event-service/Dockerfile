FROM amazoncorretto:23-alpine-jdk

ARG SPRING_MONGODB_URI
ENV SPRING_MONGODB_URI=$SPRING_MONGODB_URI
# Install Maven
RUN apk add --no-cache maven

# SET THE WORKING DIRECTORY
WORKDIR /opt/event-service

# Copy pom.xml and install dependencies (this helps cache dependencies)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the source code
COPY src ./src

RUN echo $SPRING_MONGODB_URI

# Build the Spring Boot JAR
RUN mvn clean package

EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "./target/event-service-0.0.1-SNAPSHOT.jar"]

