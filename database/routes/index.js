const express = require('express');
const router = express.Router();

// Mount individual route handlers here as they are developed
// router.use('/users', require('./userRoutes'));
// router.use('/leaves', require('./leaveRoutes'));
// router.use('/students', require('./studentRoutes'));

// Fallback stub API
router.get('/', (req, res) => {
    res.json({ message: "ERP API v1 Default Route" });
});

module.exports = router;
