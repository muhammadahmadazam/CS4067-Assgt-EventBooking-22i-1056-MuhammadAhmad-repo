FROM node:22-alpine

WORKDIR /opt/booking-service

COPY . .

RUN npm install

RUN addgroup -S bookinguser && adduser -S bookinguser -G bookinguser
RUN chown -R bookinguser:bookinguser /opt/booking-service

USER bookinguser

CMD ["node", "src/index.js"]