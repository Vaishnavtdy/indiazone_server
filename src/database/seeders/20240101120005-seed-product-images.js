'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get existing products for foreign keys
    const products = await queryInterface.sequelize.query(
      'SELECT id, created_by FROM products LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (products.length === 0) {
      console.log('Skipping product images seeding - no products found');
      return;
    }

    // Insert sample product images
    const productImages = [];
    
    products.forEach((product, index) => {
      // Add 2-3 images per product
      const imageCount = 2 + (index % 2); // 2 or 3 images per product
      
      for (let i = 0; i < imageCount; i++) {
        productImages.push({
          product_id: product.id,
          image_url: `https://images.pexels.com/photos/${1000000 + (index * 10) + i}/pexels-photo-${1000000 + (index * 10) + i}.jpeg`,
          alt_text: `Product ${product.id} image ${i + 1}`,
          is_primary: i === 0, // First image is primary
          sort_order: i,
          file_size: 150000 + (i * 50000), // Simulated file sizes
          file_type: 'image/jpeg',
          created_by: product.created_by,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('product_images', productImages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('product_images', null, {});
  }
};