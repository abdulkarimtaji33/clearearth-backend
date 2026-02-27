const db = require('../models');

exports.getAll = async (req, res) => {
  const types = await db.MaterialType.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC'], ['display_name', 'ASC']],
    attributes: ['id', 'value', 'display_name', 'display_order'],
  });
  res.json({ success: true, data: types });
};
