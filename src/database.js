const mysql = require("mysql2/promise");
const {log} = require('./logger');

class Database {
    /**
     * @param {string} uri
     */
    async connect(uri) {
        this._pool = await mysql.createPool({
            uri,
        });
    }

    async stop() {
        await this._pool.end();
    }

    /**
     * @param {string} sql
     * @param {Array.<string | number>=} params
     * @returns {Promise.<DatabaseResult>}
     */
    async executeQuery(sql, params) {
        log(sql, params);
        return convertResult(await this._pool.query(sql, params));
    }

    /**
     * @param {Database~transactionCallback} executor
     * @return {Promise.<any>}
     */
    async executeTransaction(executor) {
        const connection = await this._pool.getConnection();
        const result = await executor({
            executeQuery: async (sql, params) => {
                return convertResult(await connection.query(sql, params));
            },
        });
        await connection.release();
        return result;
    }
}

module.exports = Database;

/**
 * @param rows
 * @param {Array} rows[0]
 * @param {number} rows.insertId
 * @param {number} rows.affectedRows
 * @return {DatabaseResult}
 */
function convertResult([rows]) {
    return {
        rows : Array.isArray(rows) ? Array.from(rows) : [], // to normal array
        metadata: {
            insertId: rows.insertId,
            affectedRows: rows.affectedRows,
        }
    };
}


/**
 * @callback Database~transactionCallback
 * @param {Object} connection
 * @param {Database~executeQuery} connection.executeQuery
 * @return {Promise.any} result
 */

/**
 * @callback Database~executeQuery
 * @param {string} sql
 * @param {Array.<string | number>=} params
 * @return {Promise.<DatabaseResult>}
 */

/**
 * @typedef {Object} DatabaseResult
 * @param {Array<Object>} rows
 * @param {Object} metadata
 * @param {number} metadata.insertId
 * @param {number} metadata.affectedRows
 **/