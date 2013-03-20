## Introduction

BirdReader is installable on any unix-like machine that can run Node.js 0.8.x or 0.10.x and an internet connection. My BirdReader server is an
Amazon EC2 "micro" server which is free. You can also install it on your local Mac, PC or Ubuntu machine. Or you could install it on a 
Raspberry Pi. I need to test this last claim

## Installing Node.js on Raspberry Pi

```
$ curl http://nodejs.org/dist/v0.8.16/node-v0.8.16.tar.gz | tar xz 
$ cd node-v0.8.16
$ ./configure
$ make
$ sudo make install
```

## Install BirsdReader

```
cd ~
git clone git://github.com/glynnbird/birdreader.git
cd birdreader
npm install
vi includes/config.json
```

## Which is best?

So what's the difference between a local install, a cloud install or a Raspberry Pi install. Here are the figures. Using the same Cloudant 
CouchDB database (hosted in the UK) I tried:

* MacBook Air 1.8Ghz Core 2 Duo (localhost)
* Raspberry Pi 800Mhz Arm on local network
* Amazon EC2 "Micro" hosted in Ireland

This command was used on each machine, to eliminate network speed: 

```
$ time curl 'http://localhost:3000/unread' > /dev/null
```

![RPi test](https://github.com/glynnbird/birdreader/raw/master/public/images/rpi.jpg "Raspberry Pi")

and the results were:

Mac: 0.21s
RPi: 0.65s
EC2: 0.13s

So EC2 is the fastest at delivering raw pages to localhost. But what if I do the tests from my machine?

Mac: 0.21s
RPi: 0.75s
EC2: 0.25s

In conclusion, the Raspberry Pi is quite capable of delivering sub-second page times but the best performance, not surprisingly, goes to the 



