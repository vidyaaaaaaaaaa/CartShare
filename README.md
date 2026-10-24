# CartShare – Collaborative Shopping Cart 🛒🤝

> **A beginner-friendly, real-time collaborative grocery & shopping cart web application designed for college projects, roommates, and group shoppers.**

Built with **100% Vanilla JavaScript, HTML5, CSS3, and Bootstrap 5**.  
No Node.js, no React, and no backend server required!

---

## 🌟 Overview & Key Features

CartShare solves the common problem of roommates, friends, or families trying to coordinate shopping lists and split grocery bills. Users can create a shared room, invite others with a unique room code or share link, and add/edit items collaboratively.

### ✨ Highlights
1. **Welcome / Room Setup Page**
   - Personalize with your name or nickname.
   - One-click **Create Room** (generates unique codes like `CART-742`).
   - Quick **Join with Code** or direct URL link (`?room=CART-742`).
   - Recent rooms chips for instant re-access on your device.

2. **Live Multi-Tab Real-Time Synchronization**
   - Powered by the browser's native **HTML5 `window.storage` event**.
   - Open CartShare in two browser tabs side-by-side: When **Tab 1** adds an item or adjusts a quantity, **Tab 2** updates automatically in real-time with an instant notification toast—without refreshing!
   - Each tab maintains its own active user name via `sessionStorage`, allowing true multi-user simulation.

3. **Shared Cart & Item Controls**
   - Add items with name, category (Groceries, Snacks, Dairy, Beverages, Household, etc.), price (₹), and quantity.
   - Quick one-click suggestion chips for common essentials (Milk, Eggs, Bread, Coffee, Chips).
   - Quantity stepper buttons (`+` / `-`) and instant item deletion.
   - Identifies who added each item with user avatar badges.
   - Category filter pills (Filter by Dairy, Snacks, etc.).

4. **Automated Calculations & Free-Delivery Goal Indicator**
   - Automatically computes subtotal, item counts, and grand total.
   - **₹1,000 Free Delivery Goal**: Dynamic progress bar that fills up as items are added.
     - Under ₹1,000: Shows remaining amount needed and applies ₹50 standard delivery fee.
     - ₹1,000 and above: Unlocks **FREE Express Delivery**, waives the delivery fee, and shows celebratory banner!

5. **Roommate Bill Splitter**
   - Displays equal split per person based on the number of roommates (1 to 6 members).
   - Individual contribution breakdown showing the exact rupee value of items claimed/added by each person.

6. **Live Activity Stream**
   - An audit trail that logs every action: room creation, joining, items added, quantity changes, and items removed, complete with timestamps.

7. **Printable Shopping Receipt & Bill**
   - Generates an authentic supermarket/grocery receipt modal with itemized table, shopper contributions, and barcode decoration.
   - Uses CSS `@media print` rules: clicking **Print Receipt** isolates the receipt on clean white paper and hides all web page controls, buttons, headers, and footers.

---

## 📂 Project Structure

```text
CartShare/
├── index.html        # Main HTML structure, views, modals, and templates
├── css/
│   └── style.css     # Purple-themed design tokens, cards, animations, and @media print
├── js/
│   └── app.js        # State, localStorage persistence, storage event sync, calculations
├── assets/
│   └── logo.svg      # App icon and vector brand asset
└── README.md         # Documentation, testing guide, and deployment steps
```

---

## 🚀 How to Run Locally

Because CartShare is built with standard web technologies, **no npm install, build step, or server configuration is necessary**.

### Option A: Direct Open (Simplest)
1. Navigate to the `CartShare` folder on your computer.
2. Double-click `index.html` to open it in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option B: Using VS Code Live Server (Recommended)
1. Open the `CartShare` folder in **Visual Studio Code**.
2. If you have the **Live Server** extension installed, right-click `index.html` and select **Open with Live Server**.
3. The app will launch at `http://127.0.0.1:5500/index.html`.

### Option C: Using Python Simple HTTP Server
If you have Python installed, open your command prompt/terminal inside the `CartShare` directory and run:
```bash
# Python 3
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 🧪 How to Test Multi-Tab Collaboration (For Evaluators & Demos)

Follow these easy steps to demonstrate real-time cross-tab synchronization during your project presentation:

1. **Open Tab 1**:
   - Open `index.html` in your browser.
   - Enter your name as **"Priya"**.
   - Click **"Create New Room"**.
   - Note the room code generated at the top (e.g., `CART-842`).
   - Click **"Copy Code"** or **"Share Link"**.

2. **Open Tab 2 (Side-by-Side)**:
   - Open a second browser tab (or an Incognito window) side-by-side with Tab 1.
   - Paste the link or open `index.html`.
   - Enter a different name, such as **"Alex"**.
   - Enter the room code from Tab 1 (e.g., `CART-842`) and click **"Join Room"**.

3. **Perform Real-Time Actions**:
   - In Tab 1 (Priya), add `"Organic Milk"`, Price: `₹60`, Qty: `2`.
   - Notice Tab 2 (Alex) **instantly displays the new item and updates the total** without any manual page reload!
   - In Tab 2 (Alex), click the `+` button on Milk to increase its quantity to `3`.
   - In Tab 1 (Priya), observe the quantity change, the subtotal recalculation, and a notification toast: *"Cart updated by another shopper in real time!"*.
   - Check the **Activity Stream** on both tabs to see the audit trail of both shoppers.
   - Click **"View Receipt / Bill"** -> **"Print Receipt"** to preview the clean printable receipt.

---

## 🌐 How to Deploy to GitHub Pages (Free Hosting)

You can host CartShare online for free on GitHub Pages in under 2 minutes:

1. **Create a GitHub Repository**:
   - Go to [github.com](https://github.com) and click **New Repository**.
   - Name it `CartShare` and set it to **Public**.

2. **Upload Your Files**:
   - Upload all the files inside `CartShare/`:
     - `index.html` (must be in the root of the repository)
     - `css/style.css`
     - `js/app.js`
     - `assets/logo.svg`
     - `README.md`
   - Commit the files to the `main` branch.

3. **Enable GitHub Pages**:
   - In your GitHub repository, click on the **Settings** tab.
   - In the left sidebar, click **Pages** (under the "Code and automation" section).
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/(root)`, then click **Save**.

4. **Access Your Live Website**:
   - Wait 30–60 seconds.
   - GitHub will provide your live URL:
     `https://<your-username>.github.io/CartShare/`
   - Anyone can now access and test your collaborative shopping cart on their phone or computer!

---

## 💻 Technical Details & Code Architecture

- **Data Persistence**: Uses `localStorage.setItem('cartshare_room_' + roomCode, JSON.stringify(roomData))`. Each room's data is isolated under its own room code key.
- **Cross-Tab Reactivity**: Uses `window.addEventListener('storage', handleStorageEvent)`. The browser fires this event across all windows and tabs of the same origin whenever a `localStorage` item is updated.
- **Session Identity**: Uses `sessionStorage.setItem('cartshare_user_name', name)` so distinct tabs can act as different shoppers simultaneously without clobbering each other's identities.
- **Print Optimization**: Uses `@media print` stylesheet rules to suppress headers, buttons, navigation, modals, and backgrounds while formatting the receipt with monospace font, borders, and margins.

---

## 🎓 College Project Attribution
- **Project Name:** CartShare – Collaborative Shopping Cart
- **Domain:** Web Development / Client-Side Web Applications
- **Technologies:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3
- **Author:** College Project Submission
