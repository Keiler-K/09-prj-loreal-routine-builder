/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const productModal = document.getElementById("productModal");
const modalProductDetails = document.getElementById("modalProductDetails");
const goBackButton = document.getElementById("goBack");
const continueButton = document.getElementById("continue");

/* Other variables */
let chosenProducts = [];
let currentProduct = null;

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <button class="product-card" type="button" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </button>
  `,
    )
    .join("");

  products.forEach((product) => {
    const productCard = document.querySelector(
      `.product-card[data-product-id="${product.id}"]`,
    );
    productCard.addEventListener("click", () => showDescription(product));
  });
}
/* Show a modal when a product is clicked on */
function showDescription(product) {
  currentProduct = product;
  productModal.classList.add("is-open");
  modalProductDetails.innerHTML = `
    <div class="modal-product-layout">
      <div class="modal-product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="modal-product-copy">
        <p class="modal-product-brand">${product.brand}</p>
        <h2 id="modalProductName">${product.name}</h2>
        <p class="modal-product-category">${product.category}</p>
        <p class="modal-product-description">${product.description}</p>
      </div>
    </div>
  `;
}

/* Close the modal from the close button or continue button. */
function closeModal(product = null) {
  if (product) {
    chosenProducts.push(product);
    updateSelectedProducts();
  }
  currentProduct = null;
  modalProductDetails.innerHTML = "";
  productModal.classList.remove("is-open");
}

/* Update the list of selected products in the UI */
function updateSelectedProducts() {
  selectedProductsList.innerHTML = chosenProducts
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img class="product-image" src="${product.image}" alt="${product.name}">
      <span>${product.name}</span>
    </div>
  `,
    )
    .join("");
  chosenProducts.forEach((product) => {
    const productCard = selectedProductsList.querySelector(
      `.product-card[data-product-id="${product.id}"]`,
    );
    productCard.addEventListener("click", () => {
      chosenProducts = chosenProducts.filter(
        (chosenProduct) => chosenProduct.id !== product.id,
      );
      updateSelectedProducts();
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory,
  );
  displayProducts(filteredProducts);
});

goBackButton.addEventListener("click", () => closeModal());
continueButton.addEventListener("click", () => closeModal(currentProduct));

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});