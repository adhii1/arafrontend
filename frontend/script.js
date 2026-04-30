// ===== GLOBAL VARIABLES =====
// If running on Netlify or GitHub Pages, point this to your backend Railway URL.
// IMPORTANT: Update this URL to match your EXACT Railway deployment URL!
let BASE_URL = "https://arabackend-s633.onrender.com";

let whatsappURL = "";
let cart = []; // Store cart items


// ===== CAROUSEL LOGIC =====
function slideCarousel(carouselId, direction) {
  const track = document.getElementById(carouselId);
  const wrapper = track.parentElement;
  // Scroll by 80% of the visible container width
  const scrollAmount = wrapper.clientWidth * 0.8;
  wrapper.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// ===== QTY & CART LOGIC =====
function changeQty(btn, amount) {
  const input = btn.parentElement.querySelector('input');
  let currentVal = parseInt(input.value) || 1;
  let newVal = currentVal + amount;
  if (newVal < 1) newVal = 1;
  input.value = newVal;
}

function addToCart(productName, btn) {
  const input = btn.parentElement.querySelector('.qty-selector input');
  const qty = parseInt(input.value) || 1;

  const existingItem = cart.find(item => item.name === productName);
  if (existingItem) {
    existingItem.qty += qty;
  } else {
    cart.push({ name: productName, qty: qty });
  }
  updateCartDisplay();

  // reset input
  input.value = 1;
  alert(qty + " x " + productName + " added to cart!");
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartList = document.getElementById("cartItemsList");
  const submitBtn = document.getElementById("submitOrderBtn");

  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = "<li>Cart is empty</li>";
    submitBtn.disabled = true;
    return;
  }

  submitBtn.disabled = false;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.name} x ${item.qty}</span>
      <span class="remove-btn" onclick="removeFromCart(${index})">Remove</span>
    `;
    cartList.appendChild(li);
  });
}

// ===== ORDER FORM SUBMIT & RAZORPAY =====
document.getElementById("orderForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Please add items to your cart first.");
    return;
  }

  const submitBtn = document.getElementById("submitOrderBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";

  // GET VALUES
  let name = document.getElementById("name").value;
  let phone = document.getElementById("phone").value;

  let houseNo = document.getElementById("houseNo").value;
  let street1 = document.getElementById("street1").value;
  let street2 = document.getElementById("street2").value;
  let landmark = document.getElementById("landmark").value;
  let city = document.getElementById("city").value;
  let state = document.getElementById("state").value;
  let pincode = document.getElementById("pincode").value;

  let fullAddress = `${houseNo}, ${street1}, ${street2 ? street2 + ', ' : ''}Landmark: ${landmark}, ${city}, ${state} - ${pincode}`;

  try {
    // 1. Create Order on Backend
    const response = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart: cart })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create order");

    // 2. Open Razorpay Modal
    var options = {
      "key": data.keyId,
      "amount": data.amount,
      "currency": data.currency,
      "name": "ARA by Space Design Studioz",
      "description": "Purchase of Fragrances",
      "image": "images/top1.png",
      "order_id": data.orderId,
      "handler": async function (rzp_response) {
        // 3. Verify Payment on Backend
        try {
          const verifyRes = await fetch(`${BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: rzp_response.razorpay_order_id,
              razorpay_payment_id: rzp_response.razorpay_payment_id,
              razorpay_signature: rzp_response.razorpay_signature,
              customer: { name, phone, address: fullAddress },
              cart: cart,
              amount: data.amount
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            // Success!
            processOrderAfterPayment(name, phone, fullAddress, rzp_response.razorpay_payment_id);
          } else {
            alert("Payment verification failed: " + verifyData.error);
          }
        } catch (err) {
          alert("Error verifying payment.");
          console.error(err);
        }
      },
      "prefill": {
        "name": name,
        "contact": phone
      },
      "theme": {
        "color": "#c47a2c"
      }
    };

    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
      alert("Payment Failed: " + response.error.description);
    });
    rzp1.open();

  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Proceed to Pay";
  }
});

function processOrderAfterPayment(name, phone, fullAddress, paymentId) {
  // ===== WHATSAPP MESSAGE =====
  let cartItemsText = cart.map(item => `- ${item.name} x ${item.qty}`).join("\n");

  let message = `🛒 *New Order - ARA*\n\n*Payment Success! ID:* ${paymentId}\n\n*Customer Details:*\nName: ${name}\nPhone: ${phone}\nAddress: ${fullAddress}\n\n*Order Items:*\n${cartItemsText}`;

  let whatsappNumber = "919108433694";
  whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  // ===== SHOW POPUP =====
  document.getElementById("successPopup").style.display = "flex";

  // RESET FORM & CART
  document.getElementById("orderForm").reset();
  cart = [];
  updateCartDisplay();
}

// ===== POPUP BUTTON FUNCTION =====
function goToWhatsApp() {
  window.open(whatsappURL, "_blank");
  document.getElementById("successPopup").style.display = "none";
}
