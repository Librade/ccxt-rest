FROM node:11.13.0-alpine as builder

LABEL authors="Franz See <franz@see.net.ph>"

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh alpine-sdk python

#RUN mkdir /usr/src/ccxt-rest

# Create app directory
WORKDIR /usr/src/ccxt-rest

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

FROM node:11.13.0-alpine
WORKDIR /usr/src/ccxt-rest
#COPY --from=builder /usr/local/lib /usr/local/lib
COPY --from=builder /usr/src/ccxt-rest /usr/src/ccxt-rest
RUN ln -s /usr/src/ccxt-rest/bin/www /usr/local/bin/ccxt-rest

ENV PORT 3000

EXPOSE 3000

CMD [ "npm", "start" ]
