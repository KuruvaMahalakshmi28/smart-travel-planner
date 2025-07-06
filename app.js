const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Set view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const reviewsPath = path.join(dataDir, 'reviews.json');
if (!fs.existsSync(reviewsPath)) fs.writeFileSync(reviewsPath, JSON.stringify({}));

// Home Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Blog Page (optional)
app.get('/blog', (req, res) => {
  const blogPath = path.join(__dirname, 'views', 'blog.html');
  if (fs.existsSync(blogPath)) {
    res.sendFile(blogPath);
  } else {
    res.status(404).send('Blog page not found');
  }
});

// Sample Places API
app.get('/api/places', (req, res) => {
  const samplePath = path.join(__dirname, 'data', 'sample_places.json');
  if (fs.existsSync(samplePath)) {
    const data = fs.readFileSync(samplePath);
    res.json(JSON.parse(data));
  } else {
    res.status(500).json({ error: 'sample_places.json not found' });
  }
});

// ✅ Dynamic Destination Route
app.get('/destination/:place', async (req, res) => {
  const place = req.params.place;
  const formattedPlace = place.charAt(0).toUpperCase() + place.slice(1).toLowerCase();
  const wikiURL = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedPlace)}`;
  const unsplashURL = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(place)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`;

  let description = "Description not available.";
  let image = "https://via.placeholder.com/800x400?text=Image+Unavailable";

  try {
    const wikiRes = await fetch(wikiURL);
    const wikiData = await wikiRes.json();
    if (wikiData.extract) description = wikiData.extract;
  } catch (err) {
    console.error("Wikipedia fetch failed:", err.message);
  }

  try {
    const unsplashRes = await fetch(unsplashURL);
    const unsplashData = await unsplashRes.json();
    if (unsplashData.results && unsplashData.results.length > 0) {
      image = unsplashData.results[0].urls.regular;
    }
  } catch (err) {
    console.error("Unsplash fetch failed:", err.message);
  }

  const budget = {
    flight: `₹${Math.floor(Math.random() * 30000) + 20000}`,
    hotel: `₹${Math.floor(Math.random() * 10000) + 10000}`,
    food: `₹${Math.floor(Math.random() * 5000) + 3000}`,
    transport: `₹${Math.floor(Math.random() * 3000) + 1500}`,
    activities: `₹${Math.floor(Math.random() * 4000) + 2000}`,
  };

  const reviewsData = fs.existsSync(reviewsPath) ? JSON.parse(fs.readFileSync(reviewsPath)) : {};
  const reviews = reviewsData[place.toLowerCase()] || [];

  const map = `https://www.google.com/maps/embed/v1/place?key=${process.env.GOOGLE_MAPS_KEY}&q=${encodeURIComponent(place)}`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  res.render('destination.ejs', {
    place: formattedPlace,
    image,
    map,
    mapLink,
    description,
    budget,
    reviews
  });
});


// 📝 POST: Add Review (with name, rating, comment)
app.post('/review/:place', (req, res) => {
  const place = req.params.place.toLowerCase();
  const { name, rating, review } = req.body;

  const reviews = JSON.parse(fs.readFileSync(reviewsPath));
  if (!reviews[place]) reviews[place] = [];

  reviews[place].push({
    name: name || "Anonymous",
    rating: parseInt(rating) || 0,
    comment: review
  });

  fs.writeFileSync(reviewsPath, JSON.stringify(reviews, null, 2));
  res.redirect(`/destination/${place}`);
});

// Fallback for all other routes
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🌍 Server running at http://localhost:${PORT}`);
});
