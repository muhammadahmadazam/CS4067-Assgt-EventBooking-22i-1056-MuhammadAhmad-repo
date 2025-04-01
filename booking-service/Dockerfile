FROM node:22-alpine

# SET ENVIRONMENT VARIABLES
ENV DB_USER=postgres
ENV DB_HOST=localhost
ENV DB_NAME=event_booking
ENV DB_PASSWORD=mysecretpassword
ENV DB_PORT=5432
ENV RABBITMQ_URL=amqp://localhost
ENV SPRING_BOOT_URL=http://localhost:8080
ENV PORT=3001
ENV JWT_SECRET=your_secure_secret_key_here
ENV FRONTEND_URL=http://localhost:3000

WORKDIR /opt/booking-service

COPY . .

RUN npm install

CMD ["node", "src/index.js"]