FROM node:8.4.0-alpine
COPY . /wd
RUN cd /wd && npm install && npm run build

FROM node:8.4.0-alpine
COPY --from=0 /wd/dist /
RUN mkdir -p /data/roms && mkdir -p /data/screen
CMD node /server

EXPOSE 8080