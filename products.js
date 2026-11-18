const API_URL = "https://dummyjson.com/products?limit=20";
const FALLBACK_URL = "./products.json";

let allProducts = [];
let onAddToCartCallback = null;

const el = {
  status: () => document.getElementById("products-status"),
  error: () => document.getElementById("products-error"),
  list: () => document.getElementById("product-list"),
  search: () => document.getElementById("product-search"),
  category: () => document.getElementById("category-filter"),
};

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function normalizeProduct(item) {
  return {
    id: item.id,
    title: item.title,
    price: item.price,
    category: item.category,
    thumbnail: item.thumbnail,
    stock: item.stock ?? 0,
  };
}

function setStatus(message) {
  const status = el.status();
  if (status) status.textContent = message;
}

function showError(message) {
  const error = el.error();
  if (!error) return;
  error.textContent = message;
  error.hidden = false;
}

function clearError() {
  const error = el.error();
  if (!error) return;
  error.textContent = "";
  error.hidden = true;
}

async function fetchProducts() {
  setStatus("Loading products...");
  clearError();

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    const data = await response.json();
    return data.products.map(normalizeProduct);
  } catch {
    showError("Could not reach the product server. Showing saved products instead.");
    const response = await fetch(FALLBACK_URL);
    if (!response.ok) throw new Error("Fallback products unavailable");
    const data = await response.json();
    return data.map(normalizeProduct);
  }
}

function filterProducts(products, searchText, selectedCategory) {
  const query = searchText.toLowerCase().trim();
  return products
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .filter((p) => p.title.toLowerCase().includes(query));
}

function renderProducts(products) {
  const list = el.list();
  if (!list) return;

  if (products.length === 0) {
    list.innerHTML = "";
    setStatus("No products match your search.");
    return;
  }

  setStatus(`Showing ${products.length} of ${allProducts.length} products`);

  list.innerHTML = products
    .map(
      (p) => `
      <article class="product-card">
        <img class="product-image" src="${escapeHTML(p.thumbnail)}" alt="${escapeHTML(p.title)}" loading="lazy">
        <p class="product-category">${escapeHTML(p.category)}</p>
        <h2 class="product-title">${escapeHTML(p.title)}</h2>
        <p class="product-price">${formatPrice(p.price)}</p>
        <button class="button button-primary" type="button" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>
          ${p.stock === 0 ? "Out of stock" : "Add to cart"}
        </button>
      </article>`
    )
    .join("");
}

function renderCategoryFilter(products) {
  const select = el.category();
  if (!select) return;

  const categories = [...new Set(products.map((p) => p.category))].sort();
  select.innerHTML =
    `<option value="">All categories</option>` +
    categories
      .map((c) => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`)
      .join("");
}

function applyFilters() {
  const searchText = el.search()?.value ?? "";
  const category = el.category()?.value ?? "";
  renderProducts(filterProducts(allProducts, searchText, category));
}

function setupEvents() {
  el.search()?.addEventListener("input", applyFilters);
  el.category()?.addEventListener("change", applyFilters);

  // One delegated listener, survives re-renders
  el.list()?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button || button.disabled) return;
    const product = allProducts.find((p) => p.id === Number(button.dataset.id));
    if (product && onAddToCartCallback) onAddToCartCallback(product);
  });
}

export async function initializeProducts({ onAddToCart }) {
  onAddToCartCallback = onAddToCart;

  try {
    allProducts = await fetchProducts();
  } catch {
    setStatus("");
    showError("Products could not be loaded. Please try again later.");
    return;
  }

  renderCategoryFilter(allProducts);
  renderProducts(allProducts);
  setupEvents();
}
