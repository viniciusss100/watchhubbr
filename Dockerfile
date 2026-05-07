FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY addon.js .
EXPOSE 7000
CMD ["node", "addon.js"]
