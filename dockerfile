FROM node:21-alpine

#Create a app directory
WORKDIR /app

#Install app dependencies
COPY package*.json ./

#Run npm install
RUN npm install
#Built app source
COPY . .

EXPOSE 3005

CMD ["npm", "start"]