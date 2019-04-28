const AUTHORS_TABLE = 'authors';
const BOOKS_TABLE = 'books';

/**
 * @param {Database} database
 */
module.exports = database => ({

    async createTable() {
        await database.executeQuery(`
            CREATE TABLE IF NOT EXISTS ${AUTHORS_TABLE} (
                id INT AUTO_INCREMENT,
                name VARCHAR(3000) NOT NULL,
                PRIMARY KEY(id),
                UNIQUE KEY author_name (name)
            ) ENGINE=InnoDB
        `);
        await database.executeQuery(`
            CREATE TABLE IF NOT EXISTS ${BOOKS_TABLE} (
                id INT AUTO_INCREMENT,
                title TEXT NOT NULL,
                author INT NOT NULL,
                description MEDIUMTEXT NOT NULL,
                image VARCHAR(3000) NOT NULL,
                date TIMESTAMP NOT NULL,
                PRIMARY KEY(id),
                FOREIGN KEY (author)
                    REFERENCES ${AUTHORS_TABLE}(id)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            ) ENGINE=InnoDB
        `);
    },

    /**
     * @param {number} id
     * @return {Promise.<Book>}
     */
    async getOne(id) {
        const result = await database.executeQuery(`
            SELECT book.*, author.name as author FROM ${BOOKS_TABLE} as book
            LEFT JOIN ${AUTHORS_TABLE} as author
                ON author.id = book.author
            WHERE book.id = ?`, [id]);
        return result.rows[0];
    },

    /**
     *
     * @param {object} sort
     * @param {string} sort.by
     * @param {number} sort.direction
     * @param {string} group
     * @param {number} page
     * @param {number} pageSize
     * @return {*}
     */
    async getMany(sort, group, {page, pageSize}) {
        const shouldGroup = !!group;
        const shouldJoin = !group || group === 'author';
        const sortBy = sort.by === 'author' ? 'author.name' : `book.${sort.by}`;
        const sortDirection = sort.direction > 0 ? 'ASC' : 'DESC';

        const groupStage = `GROUP BY ${group}`;
        const paginationStage = `LIMIT ? OFFSET ?`;
        const joinStage = `LEFT JOIN ${AUTHORS_TABLE} as author ON author.id = book.author`;
        const sortStage = `ORDER BY ${sortBy} ${sortDirection}`;


        let selectedFields = ['book.*', 'author.name as author'];

        if (shouldGroup) {
            const groupByForSelect = group === 'author' ? `author.name as author` : `book.${group}`;
            selectedFields = [groupByForSelect, 'COUNT(*) as `count`'];
        }

        const result = await database.executeQuery(`
            SELECT ${selectedFields.join(', ')} FROM ${BOOKS_TABLE} as book
            ${shouldJoin ? joinStage : ''}
            ${shouldGroup ? groupStage : ''}
            ${sortStage}
            ${paginationStage}
        `, [pageSize, page * pageSize]);
        return result.rows;
    },

    /**
     *
     * @param {BookWithoutId} book
     * @return {Promise.<number>}
     */
    async create(book) {
        const {title, author, description, image, date} = book;

        return database.executeTransaction(async connection => {
            let authorId = await this._getOrCreateAuthor(connection, author);

            const result = await database.executeQuery(`INSERT INTO ${BOOKS_TABLE} 
                (title, author  , description, image, date)
         VALUES (    ?,        ?,           ?,     ?,    ?)
             `, [title, authorId, description, image, date]);

            return result.metadata.insertId;
        });
    },

    /**
     *
     * @param {number} id
     * @param {BookWithoutId} bookPatch
     * @return {Promise.<number>}
     */
    async update(id, bookPatch) {

        return database.executeTransaction(async connection => {
            const patch = {...bookPatch};
            if (bookPatch.author) {
                patch.author = await this._getOrCreateAuthor(connection, patch.author);
                // todo maybe delete author if no books left
            }

            const entries = Object.entries(patch);
            let specialDateKeepStatement = patch.date ? [] : ['date = book.date'];

            const results = await database.executeQuery(`
                UPDATE ${BOOKS_TABLE} as book
                SET
                    ${specialDateKeepStatement.concat(
                entries
                    .map(([key]) => `${key} = ?`)
            )
                .join(',\n')
                }
                WHERE book.id = ?
                LIMIT 1
            `, [
                ...entries.map(([, value]) => value),
                id,
            ]);

            return results.metadata.affectedRows;
        });
    },

    async delete() {
        await database.executeQuery(`DELETE FROM ${BOOKS_TABLE}`);
        await database.executeQuery(`DELETE FROM ${AUTHORS_TABLE}`);
    },


    async _getOrCreateAuthor(connection, name) {
        let authorId = await this._getAuthor(connection, name);

        if (authorId === undefined) {
            authorId = await this._createAuthor(connection, name);
        }
        return authorId;
    },
    /**
     * @param {Object} connection
     * @param {Database~executeQuery} connection.executeQuery
     * @param name
     * @return {Promise.<number | undefined>}
     * @private
     */
    async _getAuthor(connection, name) {
        const result = await connection.executeQuery(`
                SELECT author.id FROM ${AUTHORS_TABLE} as author
                WHERE author.name = ?
                LIMIT 1
            `, [name]);
        return result.rows[0] && result.rows[0].id;
    },

    async _createAuthor(connection, name) {
        const result = await connection.executeQuery(`
            INSERT INTO ${AUTHORS_TABLE} (name) VALUES (?)
        `, [name]);
        return result.metadata.insertId;
    },
});
