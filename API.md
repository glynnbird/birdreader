## Introduction

BirdReader not only has a web interface, it also has a clean(ish) RESTful API too, which you can use to build your own front-ends

## API Reference - Articles

### Get Unread articles

GET /api/unread

Parameters - none

### Get Read articles

GET /api/read

Parameters - none

### Get Starred articles

GET /api/starred

Parameters - none

### Get Unread articles by tag

GET /api/unread/bytag/Apple

where the last item in the path is the tag name.

### Get Read articles by tag

GET /api/read/bytag/bbc

where the last item in the path is the tag name.

### Get Starred articles by tag

GET /api/starred/bytag/bbc

where the last item in the path is the tag name.

### Search

GET /api/search

Parameters: keywords - the string to search for 

e.g. /api/search?keywords=book

### Mark an article read

GET /api/:id/read

e.g. /api/b2f6ffbbb69e75df47631f1cf3808d17/read

### Mark an article 'starred'

GET /api/:id/star

e.g. /api/b2f6ffbbb69e75df47631f1cf3808d17/star

### Mark an article 'un-starred'

GET /api/:id/unstar

e.g. /api/b2f6ffbbb69e75df47631f1cf3808d17/unstar


## API Reference - Feeds

### Get all feeds

GET /api/feeds

Parameters - none


### Get a single feed

GET /api/feed/f1cf38b2f6ffbbb69e75df4763108d17

where the last item in the path is the id of the feed to fetch

### Add a tag to a feed

GET /api/feed/:id/tag/add

Parameters - tag

e.g. /api/feed/f1cf38b2f6ffbbb69e75df4763108d17/tag/add?tag=bbc

### Remove a tag from a feed

GET /api/feed/:id/tag/remove

Parameters - tag

e.g. /api/feed/f1cf38b2f6ffbbb69e75df4763108d17/tag/remove?tag=bbc

### Remove a feed

GET /api/feed/:id/remove

Parameters - none

e.g. /api/feed/f1cf38b2f6ffbbb69e75df4763108d17/remove

### Add a feed

GET /api/feed/add

Parameters - url

e.g. /api/feed/add?url=http://news.bbc.co.uk/





