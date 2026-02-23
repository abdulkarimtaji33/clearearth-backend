/**
 * Dropdown Routes
 */
const express = require('express');
const router = express.Router();
const dropdownController = require('../controllers/dropdown.controller');
const { authenticate } = require('../middlewares/auth');

// Get all dropdowns grouped by category (public - used for form dropdowns)
router.get('/all', dropdownController.getAllDropdowns);

// Get dropdowns by specific category (public - used for form dropdowns)
router.get('/category/:category', dropdownController.getDropdownsByCategory);

// Create new dropdown value (admin only)
router.post('/', authenticate, dropdownController.createDropdown);

// Update dropdown value
router.put('/:id', authenticate, dropdownController.updateDropdown);

// Delete dropdown value
router.delete('/:id', authenticate, dropdownController.deleteDropdown);

module.exports = router;
