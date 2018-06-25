# Author: Abhijit Baldawa
# rtl-nodejs-assignment
A node.js http server which scrapes TV show information from TvMaze public REST API's, stores the data in database and exposes a REST endpoint which provides a paginated list of all TV shows along with list of their casts (casts are sorted by their birthday in descending order)

As soon as the server starts, a daemon async method tvMazeScraper.start() is called at the server startup which keeps on fetching TV show/cast information in the background from TvMaze REST endpoint. Meanwhile users can still hit the REST endpoint exposed by the server (<URL>/shows?skip=0&limit=10) to get the shows which have already been fetched by that moment. Once the daemon service is done fetching all the shows and saving it in DB the users will be able to see list if all TV shows in paginated format from our REST call

#### The node.js server is written in latest ES 2017 syntax completely with async/await and latest node.js version (10.5) is used. Also, code is completely documented along with design/pattern decision description and method usage documentation

## pre-requisites
1] mongodb server must be installed

## File Structure
1] server.js -> Start point of the server <br/>
2] serverConfig.json -> Contains http server and mongodb database configuration (user should configure this) <br/>
3] tvMazeRestApis.json -> contains REST endpoints for TvMaze public REST endpoints <br/>
4] ./services/tvMazeService.js -> exposes methods which can be used to GET shows/casts details from TvMaze server via its provided public REST API's <br/>
5] ./scraper/tvMazeScraper.js -> Used for scrapping shows-cast information from TvMaze server and saves data in mongodb in database configured by user in "serverConfig.json" <br/>
6] ./routes/tvMazeShows.js -> exposes <URL>/shows?skip=0&limit=10 endpoint. <br/>
7] ./database/database.js -> Used to perform operations on Mongodb server via mongoclient <br/>
8] ./utils/index.js -> Just exposes 'formatPromiseResult' method to be used with async/await <br/>

## npm dependencies
1] express.js (latest)
2] mongodb (latest)

## Exposed REST Endpoint
### <BASE_URL>/shows -> provides a list of all shows and their respective casts (sorted by their birthday in descending order)

Optional query params for pagination: <br/>
queryparam = skip, limit <br/>
### <BASE_URL>/shows?skip=0&limit=10
<br/>
If skip AND limit both are present as query param then the API ONLY provides shows (with their casts sorted by birthday in descending order) with provided 'limit' and skips as per 'skip' thus providing a neat pagination.

## How to run
1] git clone the project <br/>
2] cd rtl-nodejs-assignment <br/>
3] npm i <br/>
4] npm start then go to ex. http://localhost:3000/shows?skip=0&limit=10 or http://localhost:3000/shows (to see all shows)
