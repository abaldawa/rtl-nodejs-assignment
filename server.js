/**
 * User: abhijit.baldawa
 */

const
    express = require('express'),
    app = express(),
    {db} = require('./database/database'),
    tvMazeShowsRouter = require('./routes/tvMazeShows'),
    {formatPromiseResult} = require('./utils'),
    {httpServer, mongodbConfig} = require('./serverConfig'),
    tvMazeScraper = require('./scraper/tvMazeScraper');

/**
 * Immediately invoking async method which does all the standard server startup routine.
 */
(async () =>{
    let
        err,
        result;

    // --------------------- 1. Add all the required express middleware ---------------------
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use( '/shows', tvMazeShowsRouter );
    // --------------------- 1. END --------------------------------------------------------


    // -------------------- 2. initialize database -----------------------------------------
    [err, result] = await formatPromiseResult(
                            db.init(mongodbConfig)
                          );

    if( err ) {
        console.log(`Failed to connect to mongodb. Stopping server...`);
        process.exit(1);
    }
    // -------------------- 2. END --------------------------------------------------------


    // ------------------- 3. Start Http Server -------------------------------------------
    await new Promise((resolve, reject) => {
            app.listen(httpServer.port, () => {
                resolve();
            });
          });

    console.log(`Server is listening on port = ${httpServer.port}`);
    // -------------------- 3. END -------------------------------------------------------


    // ----- 4. Start scrapping data from TvMaze server as a daemon async method ---------
    tvMazeScraper.start();
})();