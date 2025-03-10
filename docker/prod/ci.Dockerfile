FROM node:20-alpine

ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app

COPY ./package*.json ./

RUN npm install

RUN npm install @opentelemetry/sdk-node

RUN npm install @opentelemetry/auto-instrumentations-node

RUN npm install @opentelemetry/exporter-trace-otlp-http

COPY . .

EXPOSE 5000

CMD ["node", "-r", "./tracing.cjs", "index.js"]