/**
 * User: abhijit.baldawa
 *
 * This module exposes REST endpoint for /shows URL
 */

const
    express = require('express'),
    router = express.Router(),
    {formatPromiseResult} = require('../utils'),
    {db} = require('../database/database'),
    COLLECTION_NAME = "shows";

/**
 * REST Endpoint <BASE_URL>/shows
 * This endpoint responds with ALL the shows and their casts (casts sorted by their birthday in descending order) by querying data
 * from the database if 'skip' and 'limit' query param is NOT set.
 *
 * If req  have 'skip' and 'limit' query param set, then the REST API will return records respecting the skip and will limit records
 * based on 'limit' value. If the 'skip' and/or 'limit' query param is not set then this REST endpoint returns ALL the records.
 *
 * Example response returned by this endpoint is as below:
 *  {
 *      "id": <Number (show ID)>,
 *      "name": <String (show name)>,
 *      "cast": [
 *          {
 *              "id": <Number (cast ID)>,
 *              "name": <String (cast name)>,
 *              "birthday": <String (cast birthday in YYYY-MM-DD format)>
 *          },
 *          ...
 *      ]
 *  }
 */
router.get( '/', async (req, res) => {
    let
        {skip, limit} = req.query,
        err,
        result,
        pipeline = [
            {$sort: {id:1}},
            {$unwind: {path: "$cast", preserveNullAndEmptyArrays: true}},
            {$sort: {'cast.birthday': 1}},
            {$group: {_id:"$id", name: {$first: "$name"}, cast: {$push: {name: "$cast.name", birthday: "$cast.birthday", id: "$cast.id" } }  }  },
            {$sort: {_id:1}}
        ];

    if( skip && limit ) {
        skip = parseInt(skip);
        limit = parseInt(limit);

        if( !Number.isInteger(skip) || !Number.isInteger(limit) || limit < 0 || skip < 0 ) {
            return res.status(400).send(`Invalid query param 'skip' and/or 'limit'. 'skip' and 'limit' must be numbers`);
        }

        pipeline.push({$skip: skip});
        pipeline.push({$limit:limit});
    }

    [err, result] = await formatPromiseResult(
                            db.aggregate({
                                collectionName: COLLECTION_NAME,
                                pipeline
                            })
                          );

    if( err ) {
        return res.status(500).send(err);
    }

    res.send(result);
} );

module.exports = router;