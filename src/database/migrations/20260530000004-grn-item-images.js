'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [cols] = await queryInterface.sequelize.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grn_images' AND COLUMN_NAME = 'grn_item_id'`
    );
    if (cols.length === 0) {
      await queryInterface.addColumn('grn_images', 'grn_item_id', {
        type: require('sequelize').INTEGER,
        allowNull: true,
        references: { model: 'grn_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });

      await queryInterface.sequelize.query(`
        UPDATE grn_images gi
        INNER JOIN (
          SELECT grn_id, MIN(id) AS first_item_id FROM grn_items GROUP BY grn_id
        ) x ON x.grn_id = gi.grn_id
        SET gi.grn_item_id = x.first_item_id
      `);

      await queryInterface.sequelize.query(`DELETE FROM grn_images WHERE grn_item_id IS NULL`);

      const [grnIdCol] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'grn_images' AND COLUMN_NAME = 'grn_id'`
      );
      if (grnIdCol.length > 0) {
        await queryInterface.removeColumn('grn_images', 'grn_id');
      }

      await queryInterface.changeColumn('grn_images', 'grn_item_id', {
        type: require('sequelize').INTEGER,
        allowNull: false,
        references: { model: 'grn_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });

      await queryInterface.addIndex('grn_images', ['grn_item_id'], {
        name: 'idx_grn_images_item',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('grn_images', 'grn_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      UPDATE grn_images gi
      INNER JOIN grn_items gi2 ON gi2.id = gi.grn_item_id
      SET gi.grn_id = gi2.grn_id
    `);
    await queryInterface.removeColumn('grn_images', 'grn_item_id');
  },
};
