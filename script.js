/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutine = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const productModal = document.getElementById("productModal");
const modalProductDetails = document.getElementById("modalProductDetails");
const goBackButton = document.getElementById("goBack");
const continueButton = document.getElementById("continue");

//localStorage.clear(); // Clear local storage for testing purposes

/* Other variables */
let chosenProducts = [];
let currentProduct = null;
const workerURL = "https://loreal-chatbot.keiler-kroog.workers.dev";
let messageList = [
  {
    role: "system",
    content:
      "You are a polite L'Oreal Customer Service worker that specializes in helping users build routines around products from L'Oreal and other skincare brands. You will offer personalized routines with recommendations based on their chosen products. Respond ina consice bulleted list. If a user's query is unrelated to skincare products or the routine, respond by stating that you do not know.",
  },
];
const chosenProductsKey = "chosenProducts";
const messageListKey = "messageList";

/* Load saved products and messages when the page starts. */
const savedProducts = localStorage.getItem(chosenProductsKey);
const savedMessages = localStorage.getItem(messageListKey);

if (savedProducts) {
  chosenProducts = JSON.parse(savedProducts);
}

if (savedMessages) {
  messageList = JSON.parse(savedMessages);
}

/* Save the current products and messages in the browser. */
function saveToLocalStorage() {
  localStorage.setItem(chosenProductsKey, JSON.stringify(chosenProducts));
  localStorage.setItem(messageListKey, JSON.stringify(messageList));
}

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
    saveToLocalStorage();
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
      saveToLocalStorage();
      updateSelectedProducts();
    });
  });
}

updateSelectedProducts();

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

/* Product submission handler - sent to AI */
generateRoutine.addEventListener("click", (e) => {
  /* Reset messages to omit previous product selections */
  chosenProducts.forEach((product) => {
    messageList.push({
      role: "user",
      content: `add product: ${product.category}, ${product.brand} ${product.name}, ${product.description}`,
    });
  });
  saveToLocalStorage();
  e.preventDefault();
  generateAIResponse("What is my routine based on the products I selected?");
  console.log(messageList)
});

/* Chat form submission handler - OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  generateAIResponse(chatForm.textContent.value);
});

async function generateAIResponse(userInput) {
  chatWindow.textContent = "Thinking..."; // Display a loading message

  // Add the user's message to the conversation history
  messageList.push({ role: "user", content: userInput });
  saveToLocalStorage();

  // Add the user's message to the conversation history
  chatForm.reset(); // Clear the input field

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content
  try {
    // Send a POST request to the OpenAI API
    const response = await fetch(workerURL, {
      method: "POST", // We are POST-ing data to the API
      headers: {
        "Content-Type": "application/json", // Set the content type to JSON
      },
      // Send model details and system message
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messageList,
      }),
    });
    // Parse and store the response data
    const result = await response.json();
    const aiAnswer = result.choices[0].message.content;

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Add the AI's response to the conversation history
    messageList.push({ role: "assistant", content: aiAnswer });
    saveToLocalStorage();
    console.log(aiAnswer); // Log the AI's response for debugging
    chatWindow.innerHTML = aiAnswer; // Display the AI response
  } catch (error) {
    console.error("Error:", error); //Log the error
    aiAnswer = "Sorry, something went wrong. Please try again later."; // Give an error message to the user
    chatWindow.innerHTML = aiAnswer; // Display the error message
  }
}
