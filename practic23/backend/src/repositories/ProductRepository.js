const IRepository = require('./IRepository');
const Product = require('../models/Product');

class ProductRepository extends IRepository {
    /**
     * Получение всех товаров
     */
    async findAll() {
        const products = await Product.find().sort({ createdAt: -1 });
        return products.map(p => this._formatProduct(p));
    }

    /**
     * Получение товара по ID
     */
    async findById(id) {
        const product = await Product.findById(id);
        return product ? this._formatProduct(product) : null;
    }

    /**
     * Создание товара
     */
    async create(productData) {
        const { title, category, description, price, imageUrl } = productData;
        
        const newProduct = new Product({
            title,
            category,
            description,
            price,
            image_url: imageUrl
        });
        
        await newProduct.save();
        return this._formatProduct(newProduct);
    }

    /**
     * Обновление товара
     */
    async update(id, productData) {
        const { title, category, description, price, imageUrl } = productData;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { title, category, description, price, image_url: imageUrl },
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) return null;
        return this._formatProduct(updatedProduct);
    }

    /**
     * Удаление товара
     */
    async delete(id) {
        const deletedProduct = await Product.findByIdAndDelete(id);
        return deletedProduct ? this._formatProduct(deletedProduct) : null;
    }

    /**
     * Внутренний метод форматирования
     */
    _formatProduct(doc) {
        if (!doc) return null;
        const obj = doc.toObject ? doc.toObject() : doc;
        return {
            ...obj,
            id: obj._id.toString(),
            imageUrl: obj.image_url, // Маппинг для фронтенда
            _id: undefined,
            __v: undefined
        };
    }
}

module.exports = ProductRepository;