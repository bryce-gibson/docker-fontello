FROM     ubuntu:14.04
MAINTAINER Bryce Gibson "bryce.gibson@unico.com.au"

# make sure the package repository is up to date
RUN echo "deb http://archive.ubuntu.com/ubuntu $(lsb_release -sc) main universe" > /etc/apt/sources.list
RUN apt-get update && apt-get upgrade
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 && echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list

RUN apt-get update && apt-get install -y mongodb-org build-essential git curl zip inotify-tools
ENV NODE_VERSION 0.10.31
RUN curl http://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz -o /tmp/node.tar.gz && ( cd /usr/local ; tar xvzf /tmp/node.tar.gz --strip-components=1 ; )

RUN git clone --depth 1 git://github.com/fontello/fontello.git fontello && ( cd fontello && git submodule update --init && npm install )

RUN mkdir -p /data/db

ADD ./application.yml /fontello/config/application.yml

WORKDIR /fontello

RUN apt-get install -y wget automake libtool ; yes | ./support/ttfautohint-ubuntu-12.04.sh

EXPOSE 3000
CMD mongod & while ! nc -vz localhost 27017; do sleep 1; done; ./fontello.js
