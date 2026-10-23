FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

COPY main.js ./
COPY public ./public

USER node
EXPOSE 3000
CMD ["node", "main.js"]
