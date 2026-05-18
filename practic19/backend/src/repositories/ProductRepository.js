const IRepository = require('./IRepository');
const db = require('../config/db');

class ProductRepository extends IRepository {
    /**
     * Получение всех товаров
     * @returns {Promise<Array>} Массив объектов товаров
     */
    async findAll() {
        const res = await db.query('SELECT * FROM products ORDER BY id DESC');
        
        // Маппинг полей из snake_case (БД) в camelCase (API/Frontend)
        return res.rows.map(row => ({
            ...row,
            imageUrl: row.image_url, // Создаем алиас для фронтенда
        }));
    }

    /**
     * Получение товара по ID
     * @param {string} id 
     * @returns {Promise<Object|null>} Объект товара или null
     */
    async findById(id) {
        const res = await db.query('SELECT * FROM products WHERE id = $1', [id]);
        const row = res.rows[0];
        
        if (!row) return null;
        
        return {
            ...row,
            imageUrl: row.image_url
        };
    }

    /**
     * Создание нового товара
     * @param {Object} productData 
     * @returns {Promise<Object>} Созданный товар
     */
    async create(productData) {
        const { title, category, description, price, imageUrl } = productData;
        
        // Генерируем уникальный ID (так как в БД у нас VARCHAR, а не SERIAL)
        const { nanoid } = require('nanoid');
        const id = nanoid(6);

        const query = `
            INSERT INTO products (id, title, category, description, price, image_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const values = [id, title, category, description, price, imageUrl];
        
        try {
            const res = await db.query(query, values);
            const row = res.rows[0];
            
            // Возвращаем сразу с правильным ключом imageUrl
            return {
                ...row,
                imageUrl: row.image_url
            };
        } catch (err) {
            console.error('DB Create Product Error:', err);
            throw err;
        }
    }

    /**
     * Обновление товара
     * @param {string} id 
     * @param {Object} productData 
     * @returns {Promise<Object|null>} Обновленный товар
     */
    async update(id, productData) {
        const { title, category, description, price, imageUrl } = productData;
        
        const query = `
            UPDATE products 
            SET title = $1, category = $2, description = $3, price = $4, image_url = $5
            WHERE id = $6
            RETURNING *
        `;
        const values = [title, category, description, price, imageUrl, id];
        
        try {
            const res = await db.query(query, values);
            const row = res.rows[0];
            
            if (!row) return null;

            return {
                ...row,
                imageUrl: row.image_url
            };
        } catch (err) {
            console.error('DB Update Product Error:', err);
            throw err;
        }
    }

    /**
     * Удаление товара
     * @param {string} id 
     * @returns {Promise<Object|null>} Удаленный товар (для очистки файлов)
     */
    async delete(id) {
        // Сначала получаем товар, чтобы знать путь к картинке для удаления
        const product = await this.findById(id);
        
        if (!product) return null;

        const res = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        
        return {
            ...res.rows[0],
            imageUrl: product.imageUrl // Возвращаем старый URL, чтобы контроллер мог удалить файл
        };
    }
}

module.exports = ProductRepository;