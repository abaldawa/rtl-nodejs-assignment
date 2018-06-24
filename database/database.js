/**
 * User: abhijit.baldawa
 *
 * This module exposes instance of the Database class which can be used by various modules to interact with mongodb.
 */

const
    mongodb = require( 'mongodb' ),
    {formatPromiseResult} = require('../utils');

/**
 * This method accepts a config object and returns a mongodb connection URL string as per mongodb guideline
 *
 * @method private
 * @param {object} config This object has all the necessary details to connect to mongodb server as configured by user
 * @returns {string} a URL connection string as per mongodb guideline
 */
function getMongoUrlFromConfig(config) {
    let
        adminAuthSource,
        URL = "mongodb://";

    if(config.dbUser && config.dbPassword && config.authSource) {
        URL = `${URL}${config.dbUser}:${config.dbPassword}@`;
        adminAuthSource = `?authSource=${config.authSource}`;
    }

    URL = `${URL}${config.dbHost}:${config.dbPort}`;

    if(adminAuthSource) {
        URL = URL + adminAuthSource;
    }
    return URL;
}

class Database {
    constructor() {
        this.db = null;
    }

    /**
     * This method connects mongoclient to mongodb server
     * @param {object} config
     * @returns {Promise<void>}
     */
    async init( config ) {
        const
            URL = getMongoUrlFromConfig(config);

        let
            err,
            result;

        console.log(`Connecting mongoDB using URL: ${URL}`);

        [err, result] = await formatPromiseResult(
                                mongodb.MongoClient.connect(URL, {
                                    connectTimeoutMS: 9000000,
                                    socketTimeoutMS: 9000000
                                })
                              );

        if( err ) {
            console.log(`Error while connecting to database. Error: ${err.stack || err}`);
            throw err;
        }

        this.db = result.db(config.dbName);
        console.log(`Successfully connected to DB: ${config.dbName}`);
    }

    /**
     * @param {string} collectionName
     * @param {object} query
     * @param {object} data
     * @returns {Promise}
     */
    upsertOne( {collectionName, query, data} ) {
        if( !collectionName || !query || !data ) {
            return Promise.reject(`Invalid Input`);
        }

        const
            collection = this.db.collection( collectionName );

        return collection.updateOne( query, data, {upsert: true} );
    }

    /**
     * @param {string} collectionName
     * @param {Array} pipeline
     * @returns {Promise}
     */
    aggregate( {collectionName, pipeline} ) {
        const
            collection = this.db.collection( collectionName );

        return collection.aggregate( pipeline ).toArray();
    }
}

module.exports = {
    db: new Database()
};
