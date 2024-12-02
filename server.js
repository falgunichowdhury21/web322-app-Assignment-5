//https://github.com/falgunichowdhury21/web322-app-Assignment-5

const express = require('express');
const ejsLayouts = require('express-ejs-layouts');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2; // Optional for image uploads
const { Sequelize } = require('sequelize');
const { gte } = Sequelize.Op;
const streamifier = require('streamifier');
const storeService = require('./store-service');

const app = express();
const methodOverride = require('method-override');
const PORT = process.env.PORT || 8080;


// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(express.urlencoded({ extended: true }));
app.use(ejsLayouts); // Initialize express-ejs-layouts
app.use(methodOverride('_method')); // This will allow to use 'DELETE' in forms

// Initialize Sequelize
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

// Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dcewrum1y',
  api_key: '347466237954442',
  api_secret: 'rFlJrt5USFJ3ALSL7JLGq9e-7LQ',
  secure: true,
});

function formatDate(dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

sequelize.sync()
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });

// Active route handling
app.use((req, res, next) => {
  let route = req.path.substring(1);
  app.locals.activeRoute = '/' + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, '') : route.replace(/\/(.*)/, ''));
  app.locals.viewingCategory = req.query.category || null;
  app.locals.formatDate = formatDate;
  next();
});

// Redirect root to shop
app.get('/', (req, res) => res.redirect('/shop'));

// About route
app.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

// Route to add items
app.get('/items/add', (req, res) => {
    storeService.getCategories() // Fetch categories from the store service
        .then(data => {
            res.render('addPost', { categories: data }); // Pass categories to the view
        })
        .catch(() => {
            res.render('addPost', { categories: [] }); // If there's an error, pass an empty array
        });
});

// Fetch all items
app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then(data => {
            if (data.length > 0) {
                res.render('items', { items: data });
            } else {
                res.render('items', { message: "No items available.", items: [] });
            }
        })
        .catch(err => {
            res.render('items', { message: err, items: [] }); // Handle error in route
        });
});

// Shop route - Fetch items and categories for display
app.get('/shop', async (req, res) => {
  try {
    const items = await storeService.getAllItems();
    const categories = await storeService.getCategories();
    res.render('shop', { items, categories });
  } catch (error) {
    console.error(error.message);
    res.render('shop', { items: [], categories: [] }); // Handle error gracefully
  }
});

// POST route to add new item with image upload
app.post('/items/add', multer().single("featureImage"), (req, res) => {
  if (req.file) {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      try {
        const result = await streamUpload(req);
        req.body.featureImage = result.url; // Assign the image URL from Cloudinary to item data

        await storeService.addItem(req.body); // Use the service function to add the item
        res.redirect('/items');
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Item Processing Failed");
      }
    }

    upload(req); // Start the upload process
  } else {
    // If no file upload is done, just create the item
    storeService.addItem(req.body)
      .then(() => {
        res.redirect('/items');
      })
      .catch(err => {
        console.error(err.message);
        res.status(500).send("Item Processing Failed");
      });
  }
});

// Categories route to show all categories
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => {
            res.render('categories', { categories: data, message: "" }); // Ensure categories is passed
        })
        .catch(err => {
            res.render('categories', { categories: [], message: err }); // Handle error gracefully
        });
});

app.get('/categories/add', (req, res) => {
    res.render('addCategory'); // Render the addCategory view, to be created later
});

// POST route for adding a new category
app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories'); // Redirect to categories view on success
        })
        .catch(err => {
            res.status(500).send(err); // Handle error and send a 500 response
        });
});

// GET route for deleting a category by ID
app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(err => {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.get('/items/delete/:id', (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => {
            res.redirect('/items'); // Redirect to items list on success
        })
        .catch(err => {
            res.status(500).send("Unable to Remove Post / Post not found"); // Handle error
        });
});

app.post('/remove', async (req, res) => {
    const id = req.body.id; // Get the item ID from the form
    if (id) {
      await Item.destroy({ where: { id } }); // Remove item by ID
    }
    res.redirect('/'); // Redirect to the list after deletion
  });

  app.post('/remove-category', async (req, res) => {
    const id = req.body.id;
    if (id) {
      await Category.destroy({
        where: { id },
        cascade: true, // Ensure associated items are removed
      });
    }
    res.redirect('/');
  });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});