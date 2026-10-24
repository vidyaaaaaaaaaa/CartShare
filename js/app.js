/**
 * CartShare – Collaborative Shopping Cart
 * Pure Vanilla JavaScript implementation with multi-tab real-time sync using localStorage.
 * No framework, no Node.js, no backend required!
 */

// =============================================================================
// 1. APPLICATION STATE & STORAGE CONFIGURATION
// =============================================================================

const APP_CONFIG = {
  FREE_DELIVERY_THRESHOLD: 1000, // ₹1,000 threshold for free delivery
  STANDARD_DELIVERY_FEE: 50,     // ₹50 standard delivery charge
  STORAGE_PREFIX: 'cartshare_room_',
  RECENT_ROOMS_KEY: 'cartshare_recent_rooms',
  USER_NAME_KEY: 'cartshare_user_name',
  MAX_ACTIVITY_LOGS: 30
};

// Current in-memory state for this browser tab
const state = {
  currentUser: '',
  currentRoomCode: '',
  roomData: {
    roomCode: '',
    createdAt: null,
    items: [],
    activities: []
  },
  selectedCategory: 'ALL'
};

// =============================================================================
// 2. DOM ELEMENT REFERENCES
// =============================================================================

const elements = {
  // Views & Navigation
  welcomeView: document.getElementById('welcome-view'),
  roomView: document.getElementById('room-view'),
  navRoomInfo: document.getElementById('nav-room-info'),
  navUserName: document.getElementById('nav-user-name'),
  navUserAvatar: document.getElementById('nav-user-avatar'),
  btnLeaveRoom: document.getElementById('btn-leave-room'),
  brandLink: document.getElementById('brand-link'),

  // Welcome Form Elements
  inputUserName: document.getElementById('input-user-name'),
  nameErrorMsg: document.getElementById('name-error-msg'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  inputJoinCode: document.getElementById('input-join-code'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  recentRoomsContainer: document.getElementById('recent-rooms-container'),
  recentRoomsList: document.getElementById('recent-rooms-list'),

  // Room Banner & Delivery Bar
  displayRoomCode: document.getElementById('display-room-code'),
  btnCopyCode: document.getElementById('btn-copy-code'),
  btnShareLink: document.getElementById('btn-share-link'),
  btnOpenReceiptTop: document.getElementById('btn-open-receipt-top'),
  deliveryStatusText: document.getElementById('delivery-status-text'),
  deliveryProgressPercent: document.getElementById('delivery-progress-percent'),
  deliveryProgressBar: document.getElementById('delivery-progress-bar'),

  // Cart List & Controls
  cartItemsList: document.getElementById('cart-items-list'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartItemCountBadge: document.getElementById('cart-item-count-badge'),
  btnClearCart: document.getElementById('btn-clear-cart'),
  categoryFilterBar: document.getElementById('category-filter-bar'),

  // Calculations & Summary
  summaryTotalQty: document.getElementById('summary-total-qty'),
  summarySubtotal: document.getElementById('summary-subtotal'),
  summaryDeliveryFee: document.getElementById('summary-delivery-fee'),
  summaryDiscountRow: document.getElementById('summary-discount-row'),
  summaryGrandTotal: document.getElementById('summary-grand-total'),
  splitMemberCount: document.getElementById('split-member-count'),
  summaryPerPerson: document.getElementById('summary-per-person'),
  shopperContributionList: document.getElementById('shopper-contribution-list'),
  btnGenerateReceipt: document.getElementById('btn-generate-receipt'),

  // Add Item Form
  addItemForm: document.getElementById('add-item-form'),
  inputItemName: document.getElementById('input-item-name'),
  selectItemCategory: document.getElementById('select-item-category'),
  inputItemPrice: document.getElementById('input-item-price'),
  inputItemQty: document.getElementById('input-item-qty'),
  btnQtyMinus: document.getElementById('btn-qty-minus'),
  btnQtyPlus: document.getElementById('btn-qty-plus'),
  itemNameError: document.getElementById('item-name-error'),
  itemPriceError: document.getElementById('item-price-error'),
  itemQtyError: document.getElementById('item-qty-error'),

  // Activity Log
  activityLogList: document.getElementById('activity-log-list'),
  activityEmptyState: document.getElementById('activity-empty-state'),
  btnClearLogs: document.getElementById('btn-clear-logs'),

  // Modals & Toast
  receiptModal: new bootstrap.Modal(document.getElementById('receiptModal')),
  clearCartModal: new bootstrap.Modal(document.getElementById('clearCartModal')),
  btnConfirmClearCart: document.getElementById('btn-confirm-clear-cart'),
  btnPrintReceipt: document.getElementById('btn-print-receipt'),
  receiptRoomCode: document.getElementById('receipt-room-code'),
  receiptDate: document.getElementById('receipt-date'),
  receiptUserName: document.getElementById('receipt-user-name'),
  receiptTableBody: document.getElementById('receipt-table-body'),
  receiptTotalItems: document.getElementById('receipt-total-items'),
  receiptSubtotal: document.getElementById('receipt-subtotal'),
  receiptDelivery: document.getElementById('receipt-delivery'),
  receiptDiscountRow: document.getElementById('receipt-discount-row'),
  receiptGrandTotal: document.getElementById('receipt-grand-total'),
  receiptSplitDetails: document.getElementById('receipt-split-details'),
  appToastEl: document.getElementById('app-toast'),
  appToastMsg: document.getElementById('app-toast-msg')
};

// Bootstrap Toast Instance
const appToast = new bootstrap.Toast(elements.appToastEl, { delay: 3500 });

// =============================================================================
// 3. INITIALIZATION & URL HANDLING
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initializes app state, listens for URL params, loads stored user identity.
 */
function initApp() {
  // 1. Restore previous username if saved in sessionStorage (or localStorage fallback)
  const savedUser = sessionStorage.getItem(APP_CONFIG.USER_NAME_KEY) || localStorage.getItem(APP_CONFIG.USER_NAME_KEY);
  if (savedUser) {
    state.currentUser = savedUser;
    elements.inputUserName.value = savedUser;
  }

  // 2. Render recent rooms visited on this device
  renderRecentRooms();

  // 3. Check if URL has a room query param: e.g. index.html?room=CART-123
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');

  if (roomParam) {
    const formattedCode = roomParam.trim().toUpperCase();
    elements.inputJoinCode.value = formattedCode;

    // If user already has a saved name, auto-join immediately!
    if (state.currentUser) {
      joinRoom(formattedCode);
      return;
    }
  }

  // 4. Attach event listeners
  setupEventListeners();
}

/**
 * Wire up all user interactions, clicks, and form submissions.
 */
function setupEventListeners() {
  // Navigation
  elements.brandLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.currentRoomCode) {
      if (confirm('Leave current room and go back to home? Your cart will stay saved!')) {
        leaveRoom();
      }
    }
  });

  elements.btnLeaveRoom.addEventListener('click', () => {
    leaveRoom();
  });

  // Create Room
  elements.btnCreateRoom.addEventListener('click', () => {
    if (!validateUserName()) return;
    const newCode = generateRoomCode();
    createRoom(newCode);
  });

  // Join Room
  elements.btnJoinRoom.addEventListener('click', () => {
    if (!validateUserName()) return;
    const code = elements.inputJoinCode.value.trim().toUpperCase();
    if (!code) {
      elements.inputJoinCode.focus();
      elements.inputJoinCode.classList.add('is-invalid');
      return;
    }
    elements.inputJoinCode.classList.remove('is-invalid');
    joinRoom(code);
  });

  // Auto-uppercase room code input
  elements.inputJoinCode.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
    e.target.classList.remove('is-invalid');
  });

  // Room header action buttons
  elements.btnCopyCode.addEventListener('click', copyRoomCode);
  elements.btnShareLink.addEventListener('click', shareRoomLink);
  elements.btnOpenReceiptTop.addEventListener('click', openReceiptModal);
  elements.btnGenerateReceipt.addEventListener('click', openReceiptModal);
  elements.btnPrintReceipt.addEventListener('click', () => window.print());

  // Quantity stepper buttons in Add Item form
  elements.btnQtyMinus.addEventListener('click', () => {
    let current = parseInt(elements.inputItemQty.value, 10) || 1;
    if (current > 1) {
      elements.inputItemQty.value = current - 1;
    }
  });

  elements.btnQtyPlus.addEventListener('click', () => {
    let current = parseInt(elements.inputItemQty.value, 10) || 1;
    if (current < 99) {
      elements.inputItemQty.value = current + 1;
    }
  });

  // Quick suggestion chips
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      elements.inputItemName.value = chip.dataset.name;
      elements.inputItemPrice.value = chip.dataset.price;
      elements.selectItemCategory.value = chip.dataset.cat;
      elements.inputItemQty.value = 1;
      elements.inputItemName.focus();
    });
  });

  // Add Item form submission
  elements.addItemForm.addEventListener('submit', handleAddItemSubmit);

  // Clear Cart Modal
  elements.btnClearCart.addEventListener('click', () => {
    if (state.roomData.items.length === 0) {
      showToast('Cart is already empty!', 'info');
      return;
    }
    elements.clearCartModal.show();
  });

  elements.btnConfirmClearCart.addEventListener('click', () => {
    clearCart();
    elements.clearCartModal.hide();
  });

  // Category Filter Bar Buttons
  elements.categoryFilterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-filter-btn');
    if (!btn) return;

    document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedCategory = btn.dataset.category;
    renderCartItems();
  });

  // Roommate Split Count Change
  elements.splitMemberCount.addEventListener('change', () => {
    updateCalculations();
  });

  // Clear Activity Logs Button
  elements.btnClearLogs.addEventListener('click', () => {
    if (confirm('Clear activity history for this room?')) {
      state.roomData.activities = [];
      saveRoomData(state.roomData);
      renderActivityLogs();
      showToast('Activity logs cleared.', 'info');
    }
  });

  // Live Multi-Tab Synchronization listener (HTML5 storage event)
  window.addEventListener('storage', handleStorageEvent);
}

// =============================================================================
// 4. USER IDENTITY & VALIDATION
// =============================================================================

/**
 * Validates the user name input.
 * Stores in sessionStorage for the current tab so Tab 1 and Tab 2 can have different names.
 */
function validateUserName() {
  const name = elements.inputUserName.value.trim();
  if (!name) {
    elements.inputUserName.classList.add('is-invalid');
    elements.nameErrorMsg.classList.remove('d-none');
    elements.inputUserName.focus();
    return false;
  }
  elements.inputUserName.classList.remove('is-invalid');
  elements.nameErrorMsg.classList.add('d-none');

  state.currentUser = name;
  sessionStorage.setItem(APP_CONFIG.USER_NAME_KEY, name);
  localStorage.setItem(APP_CONFIG.USER_NAME_KEY, name); // convenience fallback
  return true;
}

// =============================================================================
// 5. ROOM CREATION, JOINING & PERSISTENCE
// =============================================================================

/**
 * Generates a random, memorable 6-character room code like "CART-842"
 */
function generateRoomCode() {
  const randomNum = Math.floor(100 + Math.random() * 900); // 3 digits
  return `CART-${randomNum}`;
}

/**
 * Creates a brand new shopping room with default empty arrays.
 */
function createRoom(roomCode) {
  const newRoom = {
    roomCode: roomCode,
    createdAt: Date.now(),
    items: [],
    activities: [
      {
        id: 'act_' + Date.now(),
        user: state.currentUser,
        action: 'created the shopping room',
        type: 'join',
        timestamp: Date.now()
      }
    ]
  };

  saveRoomData(newRoom);
  enterRoom(roomCode, newRoom);
  showToast(`Room ${roomCode} created successfully!`, 'success');
}

/**
 * Joins an existing shopping room, or creates it if it doesn't exist yet.
 */
function joinRoom(roomCode) {
  let room = getRoomData(roomCode);

  if (!room) {
    // If room doesn't exist yet, automatically initialize it for ease of testing!
    room = {
      roomCode: roomCode,
      createdAt: Date.now(),
      items: [],
      activities: []
    };
  }

  // Record join activity
  room.activities.unshift({
    id: 'act_' + Date.now() + Math.random().toString(36).substring(2, 6),
    user: state.currentUser,
    action: 'joined the room',
    type: 'join',
    timestamp: Date.now()
  });

  saveRoomData(room);
  enterRoom(roomCode, room);
  showToast(`Joined room ${roomCode} as ${state.currentUser}!`, 'success');
}

/**
 * Switches views to the active room and updates UI badges.
 */
function enterRoom(roomCode, roomData) {
  state.currentRoomCode = roomCode;
  state.roomData = roomData;

  // Add to recent rooms list
  addRecentRoom(roomCode);

  // Update URL search query without reloading
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('room', roomCode);
  window.history.pushState({ room: roomCode }, '', newUrl.toString());

  // Update Navigation UI
  elements.navUserName.textContent = state.currentUser;
  elements.navUserAvatar.textContent = state.currentUser.charAt(0).toUpperCase();
  elements.navRoomInfo.classList.remove('d-none');
  elements.displayRoomCode.textContent = roomCode;

  // Switch View Visibility
  elements.welcomeView.classList.add('d-none');
  elements.roomView.classList.remove('d-none');

  // Render everything
  renderAll();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Exits the current room and returns to the welcome view.
 */
function leaveRoom() {
  state.currentRoomCode = '';
  state.roomData = { roomCode: '', createdAt: null, items: [], activities: [] };

  // Remove room query parameter from URL
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete('room');
  window.history.pushState({}, '', newUrl.toString());

  // Hide room nav info
  elements.navRoomInfo.classList.add('d-none');

  // Switch views
  elements.roomView.classList.add('d-none');
  elements.welcomeView.classList.remove('d-none');

  renderRecentRooms();
  showToast('Exited room to welcome screen.', 'info');
}

/**
 * Saves a room object to localStorage.
 */
function saveRoomData(room) {
  const key = APP_CONFIG.STORAGE_PREFIX + room.roomCode;
  try {
    localStorage.setItem(key, JSON.stringify(room));
  } catch (error) {
    console.error('LocalStorage write error:', error);
    showToast('Storage limit reached or private mode blocked writing.', 'danger');
  }
}

/**
 * Retrieves a room object from localStorage.
 */
function getRoomData(roomCode) {
  const key = APP_CONFIG.STORAGE_PREFIX + roomCode;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('LocalStorage read error:', error);
    return null;
  }
}

/**
 * Saves room code to the recent rooms list in localStorage.
 */
function addRecentRoom(roomCode) {
  try {
    let recent = JSON.parse(localStorage.getItem(APP_CONFIG.RECENT_ROOMS_KEY) || '[]');
    // Filter out if already exists, then unshift
    recent = recent.filter(c => c !== roomCode);
    recent.unshift(roomCode);
    if (recent.length > 5) recent = recent.slice(0, 5); // keep max 5
    localStorage.setItem(APP_CONFIG.RECENT_ROOMS_KEY, JSON.stringify(recent));
  } catch (err) {
    console.warn('Recent rooms save error:', err);
  }
}

/**
 * Renders the recent rooms chips on the welcome view.
 */
function renderRecentRooms() {
  try {
    const recent = JSON.parse(localStorage.getItem(APP_CONFIG.RECENT_ROOMS_KEY) || '[]');
    if (recent.length === 0) {
      elements.recentRoomsContainer.classList.add('d-none');
      return;
    }

    elements.recentRoomsContainer.classList.remove('d-none');
    elements.recentRoomsList.innerHTML = '';

    recent.forEach(code => {
      const room = getRoomData(code);
      const itemCount = room && room.items ? room.items.length : 0;

      const chip = document.createElement('button');
      chip.className = 'btn btn-outline-purple btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-2';
      chip.innerHTML = `
        <i class="bi bi-door-open"></i>
        <span class="fw-bold">${code}</span>
        <span class="badge bg-purple-subtle text-purple">${itemCount} items</span>
      `;
      chip.addEventListener('click', () => {
        elements.inputJoinCode.value = code;
        if (validateUserName()) {
          joinRoom(code);
        }
      });
      elements.recentRoomsList.appendChild(chip);
    });
  } catch (err) {
    console.warn('Error reading recent rooms:', err);
  }
}

// =============================================================================
// 6. CART OPERATIONS: ADD, EDIT QUANTITY, REMOVE, CLEAR
// =============================================================================

/**
 * Handles the Add Item form submission with validation.
 */
function handleAddItemSubmit(e) {
  e.preventDefault();

  const nameInput = elements.inputItemName.value.trim();
  const category = elements.selectItemCategory.value;
  const priceInput = parseFloat(elements.inputItemPrice.value);
  const qtyInput = parseInt(elements.inputItemQty.value, 10);

  let isValid = true;

  // Validate Name
  if (!nameInput) {
    elements.inputItemName.classList.add('is-invalid');
    isValid = false;
  } else {
    elements.inputItemName.classList.remove('is-invalid');
  }

  // Validate Price (> 0)
  if (isNaN(priceInput) || priceInput <= 0) {
    elements.inputItemPrice.classList.add('is-invalid');
    isValid = false;
  } else {
    elements.inputItemPrice.classList.remove('is-invalid');
  }

  // Validate Quantity (>= 1)
  if (isNaN(qtyInput) || qtyInput < 1) {
    elements.inputItemQty.classList.add('is-invalid');
    isValid = false;
  } else {
    elements.inputItemQty.classList.remove('is-invalid');
  }

  if (!isValid) return;

  // Create new item object
  const newItem = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: nameInput,
    category: category,
    price: Math.round(priceInput * 100) / 100, // round to 2 decimals
    quantity: qtyInput,
    addedBy: state.currentUser,
    addedAt: Date.now()
  };

  // Add to items list
  state.roomData.items.push(newItem);

  // Add activity log
  logActivity({
    user: state.currentUser,
    action: `added "${newItem.name}" (${newItem.quantity}x, ₹${formatCurrency(newItem.price)})`,
    type: 'add'
  });

  // Save to localStorage
  saveRoomData(state.roomData);

  // Re-render
  renderAll();

  // Reset Form
  elements.addItemForm.reset();
  elements.inputItemQty.value = 1;
  elements.inputItemName.focus();

  showToast(`Added "${newItem.name}" to the cart!`, 'success');
}

/**
 * Changes an item's quantity by delta (+1 or -1).
 * If quantity drops below 1, prompts or removes the item.
 */
function changeItemQuantity(itemId, delta) {
  const item = state.roomData.items.find(i => i.id === itemId);
  if (!item) return;

  const oldQty = item.quantity;
  const newQty = oldQty + delta;

  if (newQty <= 0) {
    // If decreasing from 1 to 0, ask to remove
    if (confirm(`Remove "${item.name}" from the cart?`)) {
      removeItem(itemId);
    }
    return;
  }

  item.quantity = newQty;

  // Log activity
  const verb = delta > 0 ? 'increased' : 'decreased';
  logActivity({
    user: state.currentUser,
    action: `${verb} quantity of "${item.name}" to ${newQty}`,
    type: 'qty'
  });

  saveRoomData(state.roomData);
  renderAll();
}

/**
 * Removes an item from the shared cart.
 */
function removeItem(itemId) {
  const itemIndex = state.roomData.items.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return;

  const item = state.roomData.items[itemIndex];
  state.roomData.items.splice(itemIndex, 1);

  // Log activity
  logActivity({
    user: state.currentUser,
    action: `removed "${item.name}" from the cart`,
    type: 'remove'
  });

  saveRoomData(state.roomData);
  renderAll();
  showToast(`Removed "${item.name}"`, 'info');
}

/**
 * Clears all items from the cart.
 */
function clearCart() {
  if (state.roomData.items.length === 0) return;

  state.roomData.items = [];

  logActivity({
    user: state.currentUser,
    action: 'cleared all items from the cart',
    type: 'remove'
  });

  saveRoomData(state.roomData);
  renderAll();
  showToast('Shared cart has been cleared.', 'info');
}

// =============================================================================
// 7. RENDERING: CART ITEMS, CALCULATIONS & PROGRESS BAR
// =============================================================================

/**
 * Master render function that updates all dynamic views in the active room.
 */
function renderAll() {
  renderCartItems();
  updateCalculations();
  renderActivityLogs();
}

/**
 * Renders the list of cart items matching the currently selected category.
 */
function renderCartItems() {
  const allItems = state.roomData.items;

  // Filter items by category if selected
  const filteredItems = state.selectedCategory === 'ALL'
    ? allItems
    : allItems.filter(item => item.category === state.selectedCategory);

  elements.cartItemCountBadge.textContent = allItems.length;

  if (filteredItems.length === 0) {
    elements.cartItemsList.classList.add('d-none');
    elements.cartEmptyState.classList.remove('d-none');

    if (allItems.length > 0) {
      elements.cartEmptyState.querySelector('h4').textContent = 'No Items in this Category';
      elements.cartEmptyState.querySelector('p').textContent = `No items found under "${state.selectedCategory}". Click "All Items" above to see the full list.`;
    } else {
      elements.cartEmptyState.querySelector('h4').textContent = 'Your Shared Cart is Empty';
      elements.cartEmptyState.querySelector('p').textContent = 'No items have been added yet. Use the form on the right to add groceries, snacks, or split essentials!';
    }
    return;
  }

  elements.cartEmptyState.classList.add('d-none');
  elements.cartItemsList.classList.remove('d-none');
  elements.cartItemsList.innerHTML = '';

  // Render items in reverse order (newest first)
  [...filteredItems].reverse().forEach(item => {
    const itemTotal = item.price * item.quantity;
    const initial = item.addedBy ? item.addedBy.charAt(0).toUpperCase() : '?';

    const itemCard = document.createElement('div');
    itemCard.className = 'cart-item-card';
    itemCard.id = `card-${item.id}`;

    itemCard.innerHTML = `
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        
        <!-- Left: Item Info & Badge -->
        <div class="d-flex align-items-center gap-3">
          <div class="item-cat-icon text-center">
            <span class="item-cat-badge badge-${item.category || 'Other'}">
              ${item.category || 'Other'}
            </span>
          </div>

          <div>
            <h4 class="h6 fw-bold text-dark mb-1 text-break">${escapeHtml(item.name)}</h4>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="small fw-semibold text-purple">₹${formatCurrency(item.price)} each</span>
              <span class="text-muted small">•</span>
              <div class="item-user-tag" title="Added at ${formatTime(item.addedAt)}">
                <span class="item-user-avatar">${initial}</span>
                <span>${escapeHtml(item.addedBy || 'Shopper')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Quantity Stepper, Item Total & Delete -->
        <div class="d-flex align-items-center justify-content-between justify-content-sm-end gap-3 pt-2 pt-sm-0 border-top-sm">
          
          <!-- Stepper -->
          <div class="qty-control-group shadow-sm">
            <button class="qty-btn" onclick="changeItemQuantity('${item.id}', -1)" title="Decrease Quantity">
              <i class="bi bi-dash"></i>
            </button>
            <span class="qty-value-display">${item.quantity}</span>
            <button class="qty-btn" onclick="changeItemQuantity('${item.id}', 1)" title="Increase Quantity">
              <i class="bi bi-plus"></i>
            </button>
          </div>

          <!-- Total for line item -->
          <div class="text-end" style="min-width: 80px;">
            <span class="fw-bold fs-6 text-dark">₹${formatCurrency(itemTotal)}</span>
          </div>

          <!-- Delete Button -->
          <button class="btn btn-sm btn-link text-danger p-1" onclick="removeItem('${item.id}')" title="Remove item from cart">
            <i class="bi bi-trash fs-5"></i>
          </button>

        </div>

      </div>
    `;

    elements.cartItemsList.appendChild(itemCard);
  });
}

/**
 * Calculates subtotal, delivery charges, free-delivery threshold, and roommate split.
 */
function updateCalculations() {
  const items = state.roomData.items;

  let totalQty = 0;
  let subtotal = 0;
  const shopperTotals = {};

  items.forEach(item => {
    totalQty += item.quantity;
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;

    const user = item.addedBy || 'Anonymous';
    shopperTotals[user] = (shopperTotals[user] || 0) + lineTotal;
  });

  // Free delivery calculations
  const isFreeDelivery = subtotal >= APP_CONFIG.FREE_DELIVERY_THRESHOLD;
  const deliveryFee = subtotal === 0 ? 0 : (isFreeDelivery ? 0 : APP_CONFIG.STANDARD_DELIVERY_FEE);
  const grandTotal = subtotal + deliveryFee;

  // Update Summary DOM
  elements.summaryTotalQty.textContent = totalQty;
  elements.summarySubtotal.textContent = `₹${formatCurrency(subtotal)}`;

  if (subtotal === 0) {
    elements.summaryDeliveryFee.textContent = '₹0.00';
    elements.summaryDeliveryFee.className = 'fw-semibold text-muted';
    elements.summaryDiscountRow.classList.add('d-none');
  } else if (isFreeDelivery) {
    elements.summaryDeliveryFee.innerHTML = '<span class="text-decoration-line-through text-muted me-1">₹50.00</span> <span class="text-success fw-bold">FREE</span>';
    elements.summaryDiscountRow.classList.remove('d-none');
  } else {
    elements.summaryDeliveryFee.textContent = `₹${formatCurrency(APP_CONFIG.STANDARD_DELIVERY_FEE)}`;
    elements.summaryDeliveryFee.className = 'fw-semibold text-dark';
    elements.summaryDiscountRow.classList.add('d-none');
  }

  elements.summaryGrandTotal.textContent = `₹${formatCurrency(grandTotal)}`;

  // Update Free Delivery Progress Bar
  const progressRatio = Math.min(100, Math.round((subtotal / APP_CONFIG.FREE_DELIVERY_THRESHOLD) * 100));
  elements.deliveryProgressBar.style.width = `${progressRatio}%`;
  elements.deliveryProgressPercent.textContent = `${progressRatio}%`;

  if (subtotal === 0) {
    elements.deliveryStatusText.innerHTML = `
      <i class="bi bi-truck text-purple fs-5"></i>
      <span>Add items to unlock <strong>FREE Delivery</strong></span>
    `;
  } else if (isFreeDelivery) {
    elements.deliveryStatusText.innerHTML = `
      <i class="bi bi-check-circle-fill text-success fs-5"></i>
      <span><strong class="text-success">🎉 Congratulations!</strong> You unlocked FREE Delivery! (Saved ₹50)</span>
    `;
  } else {
    const diff = APP_CONFIG.FREE_DELIVERY_THRESHOLD - subtotal;
    elements.deliveryStatusText.innerHTML = `
      <i class="bi bi-truck text-purple fs-5"></i>
      <span>Add <strong>₹${formatCurrency(diff)}</strong> more to unlock <span class="text-purple fw-bold">FREE Delivery!</span></span>
    `;
  }

  // Roommate Bill Split Calculation
  const splitMembers = parseInt(elements.splitMemberCount.value, 10) || 2;
  const perPersonShare = grandTotal > 0 ? (grandTotal / splitMembers) : 0;
  elements.summaryPerPerson.textContent = `₹${formatCurrency(perPersonShare)}`;

  // Render per-shopper contribution pills
  renderShopperContributions(shopperTotals);
}

/**
 * Renders the breakdown of how much each user has added to the cart.
 */
function renderShopperContributions(shopperTotals) {
  elements.shopperContributionList.innerHTML = '';

  const users = Object.keys(shopperTotals);
  if (users.length === 0) {
    elements.shopperContributionList.innerHTML = '<span class="text-muted small">No items added yet</span>';
    return;
  }

  users.forEach(user => {
    const amount = shopperTotals[user];
    const initial = user.charAt(0).toUpperCase();

    const row = document.createElement('div');
    row.className = 'd-flex justify-content-between align-items-center py-1 border-bottom border-light';
    row.innerHTML = `
      <div class="d-flex align-items-center gap-1">
        <span class="item-user-avatar" style="width: 16px; height: 16px; font-size: 0.6rem;">${initial}</span>
        <span class="small text-truncate" style="max-width: 130px;">${escapeHtml(user)}</span>
      </div>
      <span class="fw-semibold small text-dark">₹${formatCurrency(amount)}</span>
    `;
    elements.shopperContributionList.appendChild(row);
  });
}

// =============================================================================
// 8. ACTIVITY LOG AUDIT SYSTEM
// =============================================================================

/**
 * Appends a new activity log entry to the room.
 */
function logActivity(entry) {
  if (!state.roomData.activities) {
    state.roomData.activities = [];
  }

  const logItem = {
    id: 'act_' + Date.now() + Math.random().toString(36).substring(2, 6),
    user: entry.user,
    action: entry.action,
    type: entry.type || 'info',
    timestamp: Date.now()
  };

  state.roomData.activities.unshift(logItem);

  // Keep within max activity bounds
  if (state.roomData.activities.length > APP_CONFIG.MAX_ACTIVITY_LOGS) {
    state.roomData.activities = state.roomData.activities.slice(0, APP_CONFIG.MAX_ACTIVITY_LOGS);
  }
}

/**
 * Renders the activity timeline feed on the right column.
 */
function renderActivityLogs() {
  const activities = state.roomData.activities || [];

  if (activities.length === 0) {
    elements.activityLogList.innerHTML = '';
    elements.activityEmptyState.classList.remove('d-none');
    return;
  }

  elements.activityEmptyState.classList.add('d-none');
  elements.activityLogList.innerHTML = '';

  activities.forEach(act => {
    const entryEl = document.createElement('div');
    entryEl.className = 'activity-entry';

    let dotClass = '';
    if (act.type === 'remove') dotClass = 'action-remove';
    if (act.type === 'join') dotClass = 'action-join';

    entryEl.innerHTML = `
      <div class="activity-dot ${dotClass}"></div>
      <div class="small">
        <strong class="text-dark">${escapeHtml(act.user)}</strong>
        <span class="text-secondary">${escapeHtml(act.action)}</span>
      </div>
      <div class="activity-time mt-1">
        <i class="bi bi-clock me-1"></i>${formatTime(act.timestamp)}
      </div>
    `;

    elements.activityLogList.appendChild(entryEl);
  });
}

// =============================================================================
// 9. MULTI-TAB SYNCHRONIZATION VIA BROWSER STORAGE EVENT
// =============================================================================

/**
 * Listens for the HTML5 window 'storage' event.
 * When Tab 1 writes to localStorage, Tab 2 gets this event automatically!
 */
function handleStorageEvent(e) {
  if (!state.currentRoomCode) return;

  const currentStorageKey = APP_CONFIG.STORAGE_PREFIX + state.currentRoomCode;

  if (e.key === currentStorageKey) {
    if (!e.newValue) {
      // Room was deleted or cleared
      state.roomData.items = [];
      state.roomData.activities = [];
      renderAll();
      showToast('Room data was cleared in another tab!', 'warning');
      return;
    }

    try {
      const updatedRoom = JSON.parse(e.newValue);
      state.roomData = updatedRoom;
      renderAll();
      showToast('Cart updated by another shopper in real time! ⚡', 'purple');
    } catch (err) {
      console.error('Failed to parse updated room storage:', err);
    }
  }
}

// =============================================================================
// 10. RECEIPT GENERATION & PRINT MODAL
// =============================================================================

/**
 * Prepares and opens the printable receipt modal.
 */
function openReceiptModal() {
  const items = state.roomData.items;

  if (items.length === 0) {
    showToast('Add at least one item to generate a receipt!', 'info');
    return;
  }

  // Set Metadata
  elements.receiptRoomCode.textContent = state.currentRoomCode;
  elements.receiptDate.textContent = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  elements.receiptUserName.textContent = state.currentUser;

  // Clear Table
  elements.receiptTableBody.innerHTML = '';

  let totalUnits = 0;
  let subtotal = 0;
  const shopperTotals = {};

  items.forEach((item, index) => {
    totalUnits += item.quantity;
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;

    const user = item.addedBy || 'Shopper';
    shopperTotals[user] = (shopperTotals[user] || 0) + lineTotal;

    const row = document.createElement('tr');
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>
        <span class="fw-semibold">${escapeHtml(item.name)}</span>
        <span class="badge bg-light text-muted border ms-1" style="font-size: 0.65rem;">${item.category}</span>
        <div class="text-muted" style="font-size: 0.72rem;">Added by: ${escapeHtml(item.addedBy)}</div>
      </td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-end">₹${formatCurrency(item.price)}</td>
      <td class="text-end fw-semibold">₹${formatCurrency(lineTotal)}</td>
    `;
    elements.receiptTableBody.appendChild(row);
  });

  const isFreeDelivery = subtotal >= APP_CONFIG.FREE_DELIVERY_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : APP_CONFIG.STANDARD_DELIVERY_FEE;
  const grandTotal = subtotal + deliveryFee;

  // Populate financial math
  elements.receiptTotalItems.textContent = totalUnits;
  elements.receiptSubtotal.textContent = `₹${formatCurrency(subtotal)}`;

  if (isFreeDelivery) {
    elements.receiptDelivery.innerHTML = '<span class="text-decoration-line-through text-muted me-1">₹50.00</span> <span class="text-success fw-bold">FREE</span>';
    elements.receiptDiscountRow.classList.remove('d-none');
  } else {
    elements.receiptDelivery.textContent = `₹${formatCurrency(deliveryFee)}`;
    elements.receiptDiscountRow.classList.add('d-none');
  }

  elements.receiptGrandTotal.textContent = `₹${formatCurrency(grandTotal)}`;

  // Populate member split summary on receipt
  elements.receiptSplitDetails.innerHTML = '';
  const memberCount = parseInt(elements.splitMemberCount.value, 10) || 2;
  const equalSplit = grandTotal / memberCount;

  const equalSplitBox = document.createElement('div');
  equalSplitBox.className = 'col-12 col-md-6';
  equalSplitBox.innerHTML = `
    <div class="p-2 border rounded bg-light">
      <strong>Equal Split (${memberCount} members):</strong>
      <div class="fs-6 fw-bold text-purple">₹${formatCurrency(equalSplit)} / person</div>
    </div>
  `;
  elements.receiptSplitDetails.appendChild(equalSplitBox);

  const individualBox = document.createElement('div');
  individualBox.className = 'col-12 col-md-6';
  let individualHtml = '<div class="p-2 border rounded bg-light"><strong>Actual Items Claimed:</strong><ul class="mb-0 ps-3">';
  Object.keys(shopperTotals).forEach(user => {
    individualHtml += `<li>${escapeHtml(user)}: <strong>₹${formatCurrency(shopperTotals[user])}</strong></li>`;
  });
  individualHtml += '</ul></div>';
  individualBox.innerHTML = individualHtml;
  elements.receiptSplitDetails.appendChild(individualBox);

  // Show Modal
  elements.receiptModal.show();
}

// =============================================================================
// 11. SHARING & CLIPBOARD UTILITIES
// =============================================================================

/**
 * Copies the current room code to the user's clipboard.
 */
function copyRoomCode() {
  if (!state.currentRoomCode) return;
  copyToClipboard(state.currentRoomCode, `Room Code "${state.currentRoomCode}" copied to clipboard!`);
}

/**
 * Generates and copies the full join link to the user's clipboard.
 */
function shareRoomLink() {
  if (!state.currentRoomCode) return;
  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(state.currentRoomCode)}`;
  copyToClipboard(shareUrl, 'Invite link copied! Share it with roommates or open in another tab.');
}

function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMessage, 'success'))
      .catch(() => fallbackCopy(text, successMessage));
  } else {
    fallbackCopy(text, successMessage);
  }
}

function fallbackCopy(text, successMessage) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(successMessage, 'success');
  } catch (err) {
    prompt('Copy this room code manually:', text);
  }
  document.body.removeChild(textArea);
}

// =============================================================================
// 12. HELPER UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats a number to 2 decimal places with thousands separators.
 */
function formatCurrency(num) {
  if (isNaN(num)) return '0.00';
  return Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formats a timestamp into human-readable time (e.g., "8:45 PM").
 */
function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Displays a toast notification.
 */
function showToast(message, type = 'info') {
  let icon = 'bi-info-circle-fill text-info';
  let bgClass = 'bg-dark';

  if (type === 'success') {
    icon = 'bi-check-circle-fill text-success';
  } else if (type === 'purple') {
    icon = 'bi-lightning-charge-fill text-warning';
    bgClass = 'bg-purple';
  } else if (type === 'warning') {
    icon = 'bi-exclamation-triangle-fill text-warning';
  } else if (type === 'danger') {
    icon = 'bi-x-circle-fill text-danger';
  }

  elements.appToastEl.className = `toast align-items-center text-white ${bgClass} border-0 rounded-4 shadow-lg`;
  elements.appToastMsg.innerHTML = `<i class="bi ${icon} fs-5"></i> <span>${escapeHtml(message)}</span>`;
  appToast.show();
}

// Explicitly bind inline HTML event handlers to window
window.changeItemQuantity = changeItemQuantity;
window.removeItem = removeItem;

