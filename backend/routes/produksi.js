const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ProduksiController = require('../controller/produksiController');

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', ProduksiController.getAll);
router.get('/:id', ProduksiController.getById);
router.post('/', ProduksiController.create);
router.put('/:id', ProduksiController.update);
router.delete('/:id', ProduksiController.delete);

module.exports = router;
