# BirdReader

## Introduction

In March 2013, Google announced that Google Reader was to be closed. I used Google Reader every day so I set out to find a replacement.
I started with other online offerings, but then I thought "I could build one". So I created BirdReader which I have released to the world
in its highly unpolished "alpha".

BirdReader is designed to be installed on your own webserver or laptop, running Node.js. 

## Features

* import your old Google Reader subscriptions 
* fetches RSS every 15 minutes
* web-based aggregated newsfeed
** mark articles as read
** delete articles without reading
** sorted in newest-first order
** bootstrap-based, responsive layout

## How does it work?

BirdReader doesn't store anything locally other than its source code and your configuration. The data is stored in Cloudant (CouchDB) database in the cloud.
You will need to sign up for a free Cloudant account (disclaimer: other hosted CouchDB services are available, and this code should work with any
CouchDB server e.g. your own).

Two databases are used:

### feeds database

The 'feeds' database stores a document per RSS feed you are subscribed to e.g.

```
{
    "_id": "f1cf38b2f6ffbbb69e75df476310b3a6",
    "_rev": "8-6ad06e42183368bd696aec8d25eb03a1",
    "text": "The GitHub Blog",
    "title": "The GitHub Blog",
    "type": "rss",
    "xmlUrl": "http://feeds.feedburner.com/github",
    "htmlUrl": "http://pipes.yahoo.com/pipes/pipe.info?_id=13d93fdc3d1fb71d8baa50a1e8b50381",
    "tags": ["OpenSource"],
    "lastModified": "2013-03-14 15:06:03 +00:00"
}
```

This data is directly imported from the Google Checkout OPML file and crucial stores:

* the url which contains the feed data (xmlUrl)
* the last modification date of the newest article on that feed (lastModified)

### articles database


