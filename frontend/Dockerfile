FROM node:18-alpine AS base

# Install libc for compatibility with some external libraries
# RUN apk add --no-cache libc6-compat

WORKDIR /opt/frontend

COPY . .

RUN npm install

RUN npm run build

ENV NODE_ENV=production

# Disable sending of telemetry data to Next.js
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]

# ENV HOSTNAME="0.0.0.0"
# CMD ["node", "server.js"]