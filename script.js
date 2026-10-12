// ===== STEP 2: Hard-coded product data =====
const PRODUCTS = [
  { id: 1, name: "Ballpen",    price: 12, icon: "🖊️", color: "c-blue" },
  { id: 2, name: "Pencil",     price: 10, icon: "✏️", color: "c-yellow" },
  { id: 3, name: "Notebook",   price: 35, icon: "📓", color: "c-pink" },
  { id: 4, name: "Yellow Pad", price: 45, icon: "📒", color: "c-amber" },
  { id: 5, name: "Eraser",     price: 8,  icon: "🧽", color: "c-mint" },
  { id: 6, name: "Ruler",      price: 15, icon: "📏", color: "c-lilac" }
];

// cart = [{ id, name, price, qty }]
let cart = [];

const peso = (n) => "₱" + n.toFixed(2);

// ===== Element references =====
const productList = document.getElementById("product-list");
const emptyCart   = document.getElementById("empty-cart");
const cartTable   = document.getElementById("cart-table");
const cartBody    = document.getElementById("cart-body");
const summaryItems = document.getElementById("summary-items");
const navCount = document.getElementById("nav-count");
const summaryTotal = document.getElementById("summary-total");
const amountInput = document.getElementById("amount-paid");
const confirmBtn  = document.getElementById("confirm-btn");
const errorMsg    = document.getElementById("error-msg");
const receiptSection = document.getElementById("receipt-section");
const receiptBox  = document.getElementById("receipt");
const newBtn      = document.getElementById("new-btn");

// ===== STEP 2: Display products =====
function renderProducts() {
  productList.innerHTML = "";
  PRODUCTS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product " + p.color;
    card.innerHTML = `
      <div class="icon" aria-hidden="true">${p.icon}</div>
      <h3>${p.name}</h3>
      <p class="price">${peso(p.price)}</p>
      <button data-add="${p.id}">Add to Cart</button>`;
    productList.appendChild(card);
  });
}

// ===== STEP 3: Cart logic =====
function addToCart(id) {
  const item = cart.find((c) => c.id === id);
  if (item) {
    item.qty += 1;
  } else {
    const p = PRODUCTS.find((x) => x.id === id);
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  }
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeItem(id);   // qty can't be zero/negative
  else renderCart();
}

function removeItem(id) {
  cart = cart.filter((c) => c.id !== id);
  renderCart();
}

function getTotal() {
  return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
}

function renderCart() {
  cartBody.innerHTML = "";
  cart.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${peso(c.price)}</td>
      <td class="qty-cell">
        <button class="qty" data-dec="${c.id}" aria-label="Decrease ${c.name}">−</button>
        <span>${c.qty}</span>
        <button class="qty" data-inc="${c.id}" aria-label="Increase ${c.name}">+</button>
      </td>
      <td>${peso(c.price * c.qty)}</td>
      <td><button class="remove" data-remove="${c.id}">Remove</button></td>`;
    cartBody.appendChild(tr);
  });

  const hasItems = cart.length > 0;
  emptyCart.hidden = hasItems;
  cartTable.hidden = !hasItems;

  // Order summary updates automatically
  const count = cart.reduce((s, c) => s + c.qty, 0);
  summaryItems.textContent = count;
  navCount.textContent = count;
  summaryTotal.textContent = peso(getTotal());
}

// ===== STEP 4: Payment validation =====
function showError(msg) {
  errorMsg.textContent = msg;
}

function confirmPayment() {
  showError("");
  const total = getTotal();
  const raw = amountInput.value.trim();

  if (cart.length === 0) return showError("Your cart is empty. Add at least one product.");
  if (raw === "") return showError("Please enter the amount paid.");

  // Number() rejects things like "abc" or "12abc" (parseFloat would accept "12abc")
  const paid = Number(raw);
  if (!Number.isFinite(paid)) return showError("Payment must be a valid number.");
  if (paid < 0) return showError("Payment cannot be negative.");

  // Compare in centavos to avoid floating-point issues
  const paidCents = Math.round(paid * 100);
  const totalCents = Math.round(total * 100);
  if (paidCents < totalCents) {
    return showError(`Insufficient payment. You still need ${peso((totalCents - paidCents) / 100)}.`);
  }

  const change = (paidCents - totalCents) / 100;
  showReceipt(total, paidCents / 100, change);
}

// ===== STEP 5: Digital receipt =====
function makeReference() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `SSO-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

function showReceipt(total, paid, change) {
  const rows = cart.map((c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.qty}</td>
      <td>${peso(c.price)}</td>
      <td>${peso(c.price * c.qty)}</td>
    </tr>`).join("");

  receiptBox.innerHTML = `
    <div>Ref No.: <strong>${makeReference()}</strong></div>
    <div>Date/Time: ${new Date().toLocaleString()}</div>
    <hr>
    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <hr>
    <div class="row"><span>Total Amount Due</span><span>${peso(total)}</span></div>
    <div class="row"><span>Amount Paid</span><span>${peso(paid)}</span></div>
    <div class="row"><span>Change</span><span>${peso(change)}</span></div>
    <hr>
    <p class="success">Payment confirmed. Thank you for your purchase!</p>`;

  receiptSection.hidden = false;
  confirmBtn.disabled = true;       // prevent paying twice for the same order
  amountInput.disabled = true;
  document.body.style.overflow = "hidden";   // lock page behind receipt modal
}

// New Transaction: clear cart, payment, errors, receipt
function newTransaction() {
  cart = [];
  amountInput.value = "";
  amountInput.disabled = false;
  confirmBtn.disabled = false;
  showError("");
  receiptBox.innerHTML = "";
  receiptSection.hidden = true;
  document.body.style.overflow = "";
  renderCart();
}

// ===== Event listeners (event delegation) =====
productList.addEventListener("click", (e) => {
  const id = e.target.dataset.add;
  if (id) addToCart(Number(id));
});

cartBody.addEventListener("click", (e) => {
  const { inc, dec, remove } = e.target.dataset;
  if (inc) changeQty(Number(inc), 1);
  if (dec) changeQty(Number(dec), -1);
  if (remove) removeItem(Number(remove));
});

confirmBtn.addEventListener("click", confirmPayment);
amountInput.addEventListener("keydown", (e) => { if (e.key === "Enter") confirmPayment(); });
newBtn.addEventListener("click", newTransaction);

// ===== Start =====
renderProducts();
renderCart();
