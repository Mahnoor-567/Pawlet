// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('show');
});

// Fetch products from backend
const productGrid = document.getElementById('product-grid');

async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:5000/api/products'); // Backend endpoint
    if (!response.ok) throw new Error('Network response was not ok');
    const products = await response.json();

    products.forEach(product => {
      const card = document.createElement('div');
      card.classList.add('product-card');

      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>$${product.price}</p>
        <a href="#" class="btn primary-btn">Add to Cart</a>
      `;
      productGrid.appendChild(card);
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    productGrid.innerHTML = "<p style='color:red; text-align:center;'>Failed to load products.</p>";
  }
}

fetchProducts();
