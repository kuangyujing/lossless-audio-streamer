FROM ubuntu:latest
RUN apt update && apt upgrade -y && apt install -y ffmpeg nodejs npm
RUN git clone https://github.com/kuangyujing/lossless-audio-streamer && cd lossless-audio-streamer && npm install && node server.js
