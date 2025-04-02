FROM node:22-alpine

ARG NEXT_PUBLIC_BOOKING_SERVICE_URL
ARG NEXT_PUBLIC_EVENT_SERVICE_URL
ARG NEXT_PUBLIC_USER_SERVICE_URL

ENV NEXT_PUBLIC_BOOKING_SERVICE_URL=$NEXT_PUBLIC_BOOKING_SERVICE_URL
ENV NEXT_PUBLIC_EVENT_SERVICE_URL=$NEXT_PUBLIC_EVENT_SERVICE_URL
ENV NEXT_PUBLIC_USER_SERVICE_URL=$NEXT_PUBLIC_USER_SERVICE_URL


# SET THE WORKING DIRECTORY
WORKDIR /opt/frontend

# SET ENVIRONMENT VARIABLES
# ENV PORT=3000
# ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1  
# Disable sending of telemetry data to Next.js

# ADD A NONROOT-USER
# RUN adduser -D nextjs
# RUN chown -R nextjs /opt/frontend/
# USER nextjs

# COPY THE FILES
# COPY --chown=nextjs . .
COPY . .

# INSTALL DEPENDENCIES - make the node_modules folder available in the container
RUN npm install 

# BUILD THE APP
RUN npm run build


#  EXPOSE PORT 3000
EXPOSE 3000

# START THE APP
CMD ["npm", "start"]

# ENV HOSTNAME="0.0.0.0"
# CMD ["node", "server.js"]
# Install libc for compatibility with some external libraries
# RUN apk add --no-cache libc6-compat
