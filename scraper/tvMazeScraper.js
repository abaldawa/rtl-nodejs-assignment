/**
 * User: abhijit.baldawa
 *
 * This module is used to scrape all the TV shows and their cast from TvMaze server via their provided public REST endpoints.
 * The scraped data is stored in mongodb as per details configured in 'mongodbConfig' in 'serverConfig.json'
 */

const
    tvMazeService = require('../services/tvMazeService'),
    {formatPromiseResult} = require('../utils'),
    {db} = require('../database/database'),
    COLLECTION_NAME = "shows",
    RATE_LIMIT = 18,
    TIMEOUT = 10000;

/**
 * This method determines whether the rate limit is reached (as set by RATE_LIMIT constant). If yes then it returns a promises
 * which resolves after 10 seconds else it returns a resolved promise. Either way the scrapper will use this promise to either pause
 * the next GET REST call to TvMaze server in-order to avoid rate limit or continue immediately if there is no need to pause.
 *
 * @method private method of this module
 * @param {number} index This represents the current index of show object which is being processed
 * @returns {Promise} Promise resolves either after the set TIMEOUT (which is 10 seconds) or immediately
 */
function checkAndWaitForRateLimit( index ) {
    if( index !== 0 && (index % RATE_LIMIT === 0) ) {
        console.log(`Hit the rate limit. Waiting for ${TIMEOUT/1000} Seconds before proceeding...`);
        return new Promise(resolve =>{
            setTimeout(resolve, TIMEOUT);
        });
    }

    return Promise.resolve();
}

/**
 * This method is executed on the server startup. Onces executed it does below:
 *  1] Get All shows from TvMaze server
 *  2] For every show fetches the casts information and upserts the show+cast object in local database. It, also respects the RATE_LIMIT
 *     and pauses its next execution till the TIMEOUT (which is 10 seconds) if the RATE_LIMIT is reached.
 *     An example record upserted in the DB in "shows" collection is as below:
 *     {
 *       "id" : <Number (this is showId)>,
 *       "name": <String (this is show name)>,
 *       "cast": [
 *          {
 *              "id": <Number (this is cast ID)>,
 *              "name": <String (this is cast full name)>,
 *              "birthday": <String (this is cast birthday in YYYT-MM-DD format exactly as returned by TvMaze API)>
 *          },
 *          ....
 *       ]
 *     }
 *
 * @method public method exposed by this module
 * @returns {Promise}
 */
async function start() {
    let
        err,
        result,
        tvMazeShowsArr;

    console.log(`Starting to scrap show+cast informatin from TvMaze server......`);

    // ----------------------------- 1. Get All shows from TvMaze server -------------------------------------
    [err, result] = await formatPromiseResult(
                            tvMazeService.getAllTvShows()
                          );

    if( err ) {
        return console.log(`Error while fetching data from TvMaze server. Error: ${err.stack || err}`);
    }

    if( !result || !Array.isArray(result) || !result.length ) {
        return console.log(`Empty response received while fetching all shows from TvMaze server`);
    }

    tvMazeShowsArr = result;
    // ----------------------------- 1. END ------------------------------------------------------------------


    // --- 2. For every show fetch the cast information and store show+cast object in local database. Also respect the RATE_LIMIT ------
    for( let [index, tvMazeShowObj] of tvMazeShowsArr.entries()) {
        if( typeof tvMazeShowObj.id !== "number" ) {
            console.log(`Missing 'id' in one the the tvMaze object. Skipping...`);
            continue;
        }

        let
            castsArr = [];

        // ------------ 2a. Fetch cast information for the current show by showId ------------------------------------
        [err, result] = await formatPromiseResult(
                                tvMazeService.getALlCastsByShowId( tvMazeShowObj.id )
                              );

        if( err ) {
            console.log(`Error fetching cast information from TvMaze server for show ID: ${tvMazeShowObj.id}. Error: ${err.stack || err}. skipping this show... `);
            await checkAndWaitForRateLimit( index );
            continue;
        }

        if( !result || !Array.isArray(result) || !result.length ) {
            console.log(`Empty response received while fetching all casts for showId = ${tvMazeShowObj.id} from TvMaze server`);
        }

        for( let castObj of result ) {
            castsArr.push({
                id: castObj.person.id,
                name: castObj.person.name,
                birthday: castObj.person.birthday
            });
        }
        // ------------------------------ 2a. END ---------------------------------------------------------------------


        // ------------------------------ 2b. Upsert the show+cast details in the database ---------------------------
        [err, result] = await formatPromiseResult(
                                db.upsertOne({
                                    collectionName: COLLECTION_NAME,
                                    query: { id: tvMazeShowObj.id },
                                    data: {
                                        $set: {
                                            id: tvMazeShowObj.id,
                                            name: tvMazeShowObj.name,
                                            cast: castsArr
                                        }
                                    }
                                })
                              );

        if( err ) {
            console.log(`Error while upserting show+cast object in the database for showId: ${tvMazeShowObj.id}. Error: ${err.stack || err}`);
            await checkAndWaitForRateLimit( index );
            continue;
        }

        if( !result || !result.result || result.result.n !== 1 ) {
            console.log(`Failed to upsert show+cast object in the database for showId: ${tvMazeShowObj.id}`);
        }
        // ---------------------------------- 2b. END ----------------------------------------------------------------

        await checkAndWaitForRateLimit( index );
    }
    // -------------------------------------- 2. END ----------------------------------------------------------------

    console.log(`Completed scraping data from TvMaze server.....`);
}

module.exports = {
    start
};