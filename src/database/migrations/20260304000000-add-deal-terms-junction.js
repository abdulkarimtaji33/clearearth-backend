'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deal_terms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      deal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'deals', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      terms_and_conditions_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'terms_and_conditions', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('deal_terms', ['deal_id']);
    await queryInterface.addIndex('deal_terms', ['terms_and_conditions_id']);
    await queryInterface.addIndex('deal_terms', ['deal_id', 'terms_and_conditions_id'], { unique: true });

    // Migrate existing terms_and_conditions_id to deal_terms (backward compatibility)
    try {
      const [deals] = await queryInterface.sequelize.query(
        `SELECT id, terms_and_conditions_id FROM deals WHERE terms_and_conditions_id IS NOT NULL AND deleted_at IS NULL`
      );
      if (deals && deals.length > 0) {
        const now = new Date();
        await queryInterface.bulkInsert('deal_terms', deals.map((d) => ({
          deal_id: d.id,
          terms_and_conditions_id: d.terms_and_conditions_id,
          sort_order: 0,
          created_at: now,
          updated_at: now,
        })));
      }
    } catch (e) {
      console.warn('Could not migrate existing deal terms:', e.message);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('deal_terms');
  },
};
