const ProductRepository = require('../repositories/ProductRepository');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Управление товарами
 */

class ProductController {
    constructor() {
        this.productRepo = new ProductRepository();
    }

    /**
     * @swagger
     * /api/products:
     *   get:
     *     summary: Получить список всех товаров
     *     tags: [Products]
     *     responses:
     *       200:
     *         description: Список товаров
     */
    async getAll(req, res) {
        try {
            const products = await this.productRepo.findAll();
            res.json(products);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/products/{id}:
     *   get:
     *     summary: Получить товар по ID
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Данные товара
     *       404:
     *         description: Товар не найден
     */
    async getById(req, res) {
        try {
            const product = await this.productRepo.findById(req.params.id);
            if (!product) return res.status(404).json({ error: "Product not found" });
            res.json(product);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/products:
     *   post:
     *     summary: Создать новый товар
     *     tags: [Products]
     *     consumes:
     *       - multipart/form-data
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               category:
     *                 type: string
     *               description:
     *                 type: string
     *               price:
     *                 type: number
     *               image:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: Товар создан
     *       400:
     *         description: Ошибка валидации
     */
    async create(req, res) {
        try {
            const { title, category, description, price } = req.body;
            if (!title || !category || !description || price === undefined) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: "All fields are required" });
            }

            const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
            const newProduct = await this.productRepo.create({ title, category, description, price, imageUrl });
            res.status(201).json(newProduct);
        } catch (err) {
            console.error(err);
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/products/{id}:
     *   put:
     *     summary: Обновить товар
     *     tags: [Products]
     *     consumes:
     *       - multipart/form-data
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *               category:
     *                 type: string
     *               description:
     *                 type: string
     *               price:
     *                 type: number
     *               image:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Товар обновлен
     *       404:
     *         description: Товар не найден
     */
    async update(req, res) {
        try {
            const id = req.params.id;
            const { title, category, description, price } = req.body;
            
            if (!title || !category || !description || price === undefined) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: "All fields are required" });
            }

            const oldProduct = await this.productRepo.findById(id);
            let imageUrl = oldProduct?.image_url;

            if (req.file) {
                if (imageUrl) {
                    const oldPath = path.join(__dirname, '../..', imageUrl);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                imageUrl = `/uploads/${req.file.filename}`;
            }

            const updatedProduct = await this.productRepo.update(id, { title, category, description, price, imageUrl });
            if (!updatedProduct) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: "Product not found" });
            }

            res.json(updatedProduct);
        } catch (err) {
            console.error(err);
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * @swagger
     * /api/products/{id}:
     *   delete:
     *     summary: Удалить товар
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       204:
     *         description: Товар удален
     *       404:
     *         description: Товар не найден
     */
    async delete(req, res) {
        try {
            const id = req.params.id;
            const deletedProduct = await this.productRepo.delete(id);
            
            if (!deletedProduct) return res.status(404).json({ error: "Product not found" });

            if (deletedProduct.imageUrl) {
                const filePath = path.join(__dirname, '../..', deletedProduct.imageUrl);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }

            res.status(204).send();
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = ProductController;