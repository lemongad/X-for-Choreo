FROM node:latest
EXPOSE 3000
WORKDIR /app

COPY files/* /app

ENV PM2_HOME=/tmp

RUN apt-get update &&\
apt-get install -y iproute2 vim procps &&\
  # Clean up APT when done.
  apt-get clean &&\
  
    

    chmod +x web entrypoint.sh nm ttyd c.js_amd64 &&\
    npm install -r package.json &&\
    npm install -g pm2 &&\
    npm run build  &&\
    npm install -r package.json

# 健康检查
HEALTHCHECK --interval=2m --timeout=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health
# 启动命令
ENTRYPOINT ["npm", "start"]
