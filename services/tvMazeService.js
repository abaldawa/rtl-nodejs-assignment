/**
 * User: abhijit.baldawa
 *
 * This module is used to get show and cast details from TvMaze server via its provided public REST API's
 * as per http://www.tvmaze.com/api
 */

const
    http = require('http'),
    {ALL_CASTS_IN_SHOW_URL, ALL_TVMAZE_SHOWS_URL} = require('../tvMazeRestApis');

/**
 * This method fetches the JSON data from the provided input URL
 *
 * Note: We are using node.js built-in 'http' module because our use-case is to just GET response from the endpoint. This way we do not
 *       have to install any third-party REST client. For more complex usage we can also use "node-fetch" (or any-other) module which
 *       returns promise by default and can be directly used with async/await without having to wrap it inside promise constructor.
 *
 * @method private method for this module
 * @param {string} URL The REST endpoint to fetch JSON data from
 * @return {Promise}
 */
function fetchDataFromUrl( URL ) {
    return new Promise((resolve, reject) => {
        if( !URL || typeof URL !== "string" ) {
            return reject( "Missing URL" );
        }

        http.get(URL, (response) => {
            let
                rawData = '';

            response.setEncoding('utf8');

            response
            .on('data', (chunk) => {
                rawData += chunk;
            })
            .on('end', () => {
                try {
                    resolve(JSON.parse(rawData));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * This method fetches ALL the shows from TvMaze server.
 *
 * @method public method exposed by this module
 * @returns {Promise}
 */
function getAllTvShows() {
    return fetchDataFromUrl(ALL_TVMAZE_SHOWS_URL);
}

/**
 * This method fetches ALL the casts by showId
 *
 * @method public method exposed by this module
 * @param {string} showId The showId whose casts needs to be fetched
 * @returns {Promise}
 */
function getALlCastsByShowId( showId ) {
    if( !showId ) {
        return Promise.reject(`Missing show ID`);
    }

    let
        castUrl = ALL_CASTS_IN_SHOW_URL.replace("$showid", showId);

    return fetchDataFromUrl( castUrl );
}

module.exports = {
    getAllTvShows,
    getALlCastsByShowId
};