/**
 * User: abhijit.baldawa
 */

/**
 * This method is supposed to be used with async/await. The purpose of this method is to enable superior error handling with async/await.
 * If async/await is used directly with promises we technically have to use a try-catch block and if there is any error in any of the
 * await operation then while logging we are not sure which method threw the error unless we cover all await(s) with try-catch
 * which is ugly and less feasible/elegant.
 *
 * This method accepts a input promise and returns a promise which resolves to either [err] if the input promise has exception
 * or [null, result] if input promise is successful. This give us precise results of every async operation, very similar to node.js
 * error first callback but with all the benefits of async/await with synchronous looking code having all the async goodness.
 *
 * An example usage is as below:
 * let [err, result] = await formatPromiseResult(promise);
 * //User can now handle err/result appropriately at every async/await step
 *
 * Using ES6 assignment destructuring the code looks concise and eliminates the mandatory need to have try-catch. User can still choose
 * to have try-catch but for handling any exception in synchronous code and not for any await.
 *
 * @method public method exposed by this module
 * @param {Promise} prom Passed in promise to format
 * @returns {Promise<[]>} If error in prom then promise resolves to [err] else [null, result]
 */
function formatPromiseResult( prom ) {
    return prom
            .then((result) => {
                return [null, result];
            })
            .catch((error) => {
                return [error];
            })
}

module.exports = {
    formatPromiseResult
};