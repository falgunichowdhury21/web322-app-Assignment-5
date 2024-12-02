const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'UwmPKJ6B7MEu', {
    host: 'ep-dry-queen-a5ets7ks.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    },
  });
  
  // Define Item and Category models
  const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE,
  });
  
  const Category = sequelize.define('Category', {
    category: Sequelize.STRING,
  });
  
  Item.belongsTo(Category, { foreignKey: 'category' });

module.exports = sequelize;
// Function to initialize the database
module.exports.initialize = function() {
    return sequelize.sync()
        .then(() => Promise.resolve())
        .catch(() => Promise.reject("Unable to sync the database"));
};

// Function to get all items
module.exports.getAllItems = function() {
    return Item.findAll()
        .then(data => {
            if (data.length === 0) {
                return Promise.reject("No results returned");
            }
            return Promise.resolve(data);
        })
        .catch(() => Promise.reject("Error retrieving items"));
};

// Function to get items by category
module.exports.getItemsByCategory = function(categoryId) {
    return Item.findAll({
        where: {
            category: categoryId
        }
    })
    .then(data => {
        if (data.length === 0) {
            return Promise.reject("No results returned");
        }
        return Promise.resolve(data);
    })
    .catch(() => Promise.reject("Error retrieving items by category"));
};

// Function to get items by minimum date
module.exports.getItemsByMinDate = function(minDateStr) {
    const { gte } = Sequelize.Op;
    return Item.findAll({
        where: {
            postDate: {
                [gte]: new Date(minDateStr)
            }
        }
    })
    .then(data => {
        if (data.length === 0) {
            return Promise.reject("No results returned");
        }
        return Promise.resolve(data);
    })
    .catch(() => Promise.reject("Error retrieving items by date"));
};

// Function to get an item by ID
module.exports.getItemById = function(id) {
    return Item.findOne({ where: { id: id } })
        .then(data => {
            if (!data) {
                return Promise.reject("No results returned");
            }
            return Promise.resolve(data);
        })
        .catch(() => Promise.reject("Error retrieving item by ID"));
};

// Function to add a new item
module.exports.addItem = function(itemData) {
    // Ensure published property is set properly
    itemData.published = (itemData.published) ? true : false;

    // Set any empty string values to null
    for (let key in itemData) {
        if (itemData[key] === "") {
            itemData[key] = null;
        }
    }
    // Set postDate to current date
    itemData.postDate = new Date();

    return Item.create(itemData)
        .then(() => Promise.resolve())
        .catch(() => Promise.reject("Unable to create post"));
};

// Function to get published items
module.exports.getPublishedItems = function() {
    return Item.findAll({ where: { published: true } })
        .then(data => {
            if (data.length === 0) {
                return Promise.reject("No results returned");
            }
            return Promise.resolve(data);
        })
        .catch(() => Promise.reject("Error retrieving published items"));
};

// Function to get published items by category
module.exports.getPublishedItemsByCategory = function(categoryId) {
    return Item.findAll({
        where: {
            published: true,
            category: categoryId
        }
    })
    .then(data => {
        if (data.length === 0) {
            return Promise.reject("No results returned");
        }
        return Promise.resolve(data);
    })
    .catch(() => Promise.reject("Error retrieving published items by category"));
};

// Function to get all categories
module.exports.getCategories = function() {
    return Category.findAll()
        .then(data => {
            if (data.length === 0) {
                return Promise.reject("No results returned");
            }
            return Promise.resolve(data);
        })
        .catch(() => Promise.reject("Error retrieving categories"));
};

module.exports.addCategory = function(categoryData) {
    return new Promise((resolve, reject) => {
        // Replace empty strings with null
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }

        // Use Category.create() to add category to the database
        Category.create(categoryData)
            .then(() => resolve()) // Resolve the promise on success
            .catch(() => reject("unable to create category")); // Reject the promise on error
    });
};

// Function to delete a category by its ID
module.exports.deleteCategoryById = function(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        })
        .then((rowsAffected) => {
            if (rowsAffected > 0) {
                resolve(); // Resolve promise if category was deleted
            } else {
                reject("Category not found"); // Reject if no rows were deleted
            }
        })
        .catch(() => reject("Error deleting category"));
    });
};

// Function to delete an item by its ID
module.exports.deletePostById = function(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id }
        })
        .then((rowsAffected) => {
            if (rowsAffected > 0) {
                resolve(); // Resolve promise if item was deleted
            } else {
                reject("Item not found"); // Reject if no rows were deleted
            }
        })
        .catch(() => reject("Error deleting item"));
    });
};
