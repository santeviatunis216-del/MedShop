// =========================================================
// 1. DONNÉES PRODUITS (extrait du DOM)
// =========================================================
function getProductFromCard(card) {
    const id = parseInt(card.dataset.id);
    const name = card.dataset.name;
    const category = card.dataset.category;
    const price = parseFloat(card.dataset.price);
    const discount = parseFloat(card.dataset.discount) || 0;
    const image = card.querySelector('img').src;
    return { id, name, category, price, discount, image };
}

function getAllProducts() {
    const cards = document.querySelectorAll('#shopGrid .product-card');
    return Array.from(cards).map(card => getProductFromCard(card));
}

const products = getAllProducts();

// =========================================================
// 2. PANIER
// =========================================================
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function getSalePrice(p) {
    return p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
}

// =========================================================
// 3. FILTRAGE DES PRODUITS
// =========================================================
function filterProducts() {
    const maxPrice = parseInt(document.getElementById('priceRange')?.value) || 500;
    const checkedCats = [...document.querySelectorAll('.cat-filter:checked')].map(el => el.value);
    const sort = document.getElementById('sortSelect')?.value || 'default';
    const allCards = document.querySelectorAll('#shopGrid .product-card');

    // Appliquer les filtres
    allCards.forEach(card => {
        const category = card.dataset.category;
        const discount = parseFloat(card.dataset.discount) || 0;
        const price = parseFloat(card.dataset.price);
        const salePrice = discount > 0 ? price * (1 - discount / 100) : price;

        const catMatch = checkedCats.includes(category) || (checkedCats.includes('soldes') && discount > 0);
        const priceMatch = salePrice <= maxPrice;

        if (catMatch && priceMatch) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    // Tri
    const visibleCards = [...allCards].filter(c => c.style.display !== 'none');
    if (sort === 'price-asc') {
        visibleCards.sort((a, b) => {
            const pa = parseFloat(a.dataset.price) * (1 - (parseFloat(a.dataset.discount) || 0) / 100);
            const pb = parseFloat(b.dataset.price) * (1 - (parseFloat(b.dataset.discount) || 0) / 100);
            return pa - pb;
        });
    } else if (sort === 'price-desc') {
        visibleCards.sort((a, b) => {
            const pa = parseFloat(a.dataset.price) * (1 - (parseFloat(a.dataset.discount) || 0) / 100);
            const pb = parseFloat(b.dataset.price) * (1 - (parseFloat(b.dataset.discount) || 0) / 100);
            return pb - pa;
        });
    }

    // Réorganiser le DOM
    const grid = document.getElementById('shopGrid');
    visibleCards.forEach(card => grid.appendChild(card));

    document.getElementById('resultCount').textContent = visibleCards.length + ' produits';
}

function renderCategory(category) {
    const allCards = document.querySelectorAll('#shopGrid .product-card');
    const gridId = category + 'Grid';
    const targetGrid = document.getElementById(gridId);
    if (!targetGrid) return;

    // Cloner les cartes correspondantes
    targetGrid.innerHTML = '';
    allCards.forEach(card => {
        if (card.dataset.category === category) {
            const clone = card.cloneNode(true);
            // Réattribuer les événements (onclick)
            const img = clone.querySelector('img');
            const name = clone.querySelector('.product-name');
            const btn = clone.querySelector('.add-to-cart');
            const id = parseInt(card.dataset.id);
            if (img) img.onclick = () => openModal(id);
            if (name) name.onclick = () => openModal(id);
            if (btn) btn.onclick = () => addToCart(id);
            targetGrid.appendChild(clone);
        }
    });
}

// =========================================================
// 4. ACCUEIL - BEST-SELLERS
// =========================================================
function updateHomePreview() {
    const allCards = document.querySelectorAll('#shopGrid .product-card');
    const homeGrid = document.getElementById('homeGrid');
    homeGrid.innerHTML = '';
    // Prendre les 4 premiers produits (ou ceux avec les plus grosses réductions)
    const sorted = [...allCards].sort((a, b) => {
        const da = parseFloat(a.dataset.discount) || 0;
        const db = parseFloat(b.dataset.discount) || 0;
        return db - da;
    }).slice(0, 4);

    sorted.forEach(card => {
        const clone = card.cloneNode(true);
        const id = parseInt(card.dataset.id);
        const img = clone.querySelector('img');
        const name = clone.querySelector('.product-name');
        const btn = clone.querySelector('.add-to-cart');
        if (img) img.onclick = () => openModal(id);
        if (name) name.onclick = () => openModal(id);
        if (btn) btn.onclick = () => addToCart(id);
        homeGrid.appendChild(clone);
    });
}

// =========================================================
// 5. PANIER (FONCTIONS)
// =========================================================
function addToCart(productId) {
    const card = document.querySelector(`#shopGrid .product-card[data-id="${productId}"]`);
    if (!card) return;
    const product = getProductFromCard(card);
    const sizeSelect = document.getElementById(`size_${productId}`);
    const size = sizeSelect ? sizeSelect.value : 'M';
    const price = getSalePrice(product);
    const existing = cart.find(item => item.id === productId && item.size === size);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, price, quantity: 1, size });
    updateCartUI();
    const btn = document.querySelector(`button[onclick="addToCart(${productId})"]`);
    if (btn) {
        btn.textContent = '✅ Ajouté';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-plus"></i> Ajouter', 800);
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const container = document.getElementById('cartItemsContainer');
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-bag"></i><p>Panier vide</p></div>';
        document.getElementById('cartTotalPrice').textContent = '0.00 TND';
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" onerror="this.src='https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=60&h=60&fit=crop'" />
                <div><strong>${item.name}</strong><br/><span style="color:#E07A5F;">T.${item.size}</span> x ${item.quantity} = ${(item.price*item.quantity).toFixed(2)} TND</div>
                <span class="cart-item-remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></span>
            </div>
        `).join('');
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        document.getElementById('cartTotalPrice').textContent = total.toFixed(2) + ' TND';
    }
    document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

function toggleCart() {
    document.getElementById('cartOverlay').classList.toggle('open');
}

function checkoutWhatsApp() {
    if (cart.length === 0) return alert('Panier vide');
    let msg = "🛍️ Commande MerveilleShop%0A";
    cart.forEach(i => msg += `➡️ ${i.name} (${i.size}) x${i.quantity} = ${(i.price*i.quantity).toFixed(2)} TND%0A`);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    msg += `%0A💰 Total : ${total.toFixed(2)} TND`;
    window.open(`https://wa.me/21651555603?text=${msg}`, '_blank');
}

// =========================================================
// 6. MODAL PRODUIT
// =========================================================
function openModal(id) {
    const card = document.querySelector(`#shopGrid .product-card[data-id="${id}"]`);
    if (!card) return;
    const product = getProductFromCard(card);
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');
    const sale = getSalePrice(product);
    body.innerHTML = `
        <div style="display:flex; flex-wrap:wrap; gap:2rem;">
            <img src="${product.image}" onerror="this.src='https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=400&fit=crop'" style="flex:1; min-width:200px; max-height:400px; object-fit:cover; border-radius:12px;" />
            <div style="flex:1;">
                <span style="color:#E07A5F; text-transform:uppercase; font-weight:600;">${product.category}</span>
                <h2>${product.name}</h2>
                <p style="font-size:2rem; color:#6B2A3B; font-weight:700;">${sale.toFixed(2)} TND ${product.discount>0 ? `<span style="font-size:1rem; color:#888; text-decoration:line-through;">${product.price.toFixed(2)} TND</span>` : ''}</p>
                <p style="color:#888; margin:1rem 0;">Pièce unique, qualité premium. Disponible en plusieurs tailles.</p>
                <label>Taille : 
                    <select id="modal_size" style="background:#FFF; color:#333; padding:0.5rem; border:1px solid #D4A373; border-radius:8px;">
                        ${(product.category === 'chaussures' ? ['39','40','41','42','43','44','45','46'] : ['XS','S','M','L','XL','XXL']).map(s => `<option value="${s}">${s}</option>`).join('')}
                    </select>
                </label>
                <br/><br/>
                <button class="btn-primary" onclick="addToCartFromModal(${product.id})"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>
                <button class="btn-secondary" onclick="closeModal()" style="margin-left:10px;">Fermer</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function addToCartFromModal(id) {
    const size = document.getElementById('modal_size')?.value || 'M';
    const card = document.querySelector(`#shopGrid .product-card[data-id="${id}"]`);
    if (!card) return;
    const product = getProductFromCard(card);
    const price = getSalePrice(product);
    const existing = cart.find(item => item.id === id && item.size === size);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, price, quantity: 1, size });
    updateCartUI();
    closeModal();
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

// =========================================================
// 7. NAVIGATION
// =========================================================
let pageHistory = ['home'];

function navigateTo(page, options = {}) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (!targetPage) return; // page inconnue : on ne casse pas l'historique
    targetPage.classList.add('active');
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add('active');

    if (page === 'shop') filterProducts();
    else if (page === 'home') updateHomePreview();
    else if (['homme', 'femme', 'chaussures', 'accessoires'].includes(page)) {
        renderCategory(page);
    }

    if (!options.skipHistory) {
        if (pageHistory[pageHistory.length - 1] !== page) {
            pageHistory.push(page);
        }
    }
    updateBackButton();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    if (pageHistory.length <= 1) return;
    pageHistory.pop(); // on retire la page actuelle
    const previousPage = pageHistory[pageHistory.length - 1];
    navigateTo(previousPage, { skipHistory: true });
}

function updateBackButton() {
    const btn = document.getElementById('backButton');
    if (!btn) return;
    btn.style.display = pageHistory.length > 1 ? 'flex' : 'none';
}

// =========================================================
// 8. FORMULAIRES (CONTACT & WHOLESALE)
// =========================================================
function sendWholesaleRequest(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]')?.value || '';
    const email = form.querySelector('input[type="email"]')?.value || '';
    const phone = form.querySelector('input[type="tel"]')?.value || '';
    const company = form.querySelectorAll('input[type="text"]')[1]?.value || '';
    const msg = form.querySelector('textarea')?.value || '';
    const productType = form.querySelector('select')?.value || '';
    const quantity = form.querySelector('input[type="number"]')?.value || '';

    const message = `📦 *Demande de devis MerveilleShop*%0A%0A` +
        `👤 Nom : ${name}%0A` +
        `📧 Email : ${email}%0A` +
        `📱 Téléphone : ${phone}%0A` +
        `🏢 Société : ${company}%0A` +
        `📦 Produits : ${productType}%0A` +
        `🔢 Quantité : ${quantity}%0A` +
        `💬 Message : ${msg}`;

    window.open(`https://wa.me/21651555603?text=${message}`, '_blank');
}

function sendContactMessage(e) {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value || '';
    const email = document.getElementById('contactEmail')?.value || '';
    const phone = document.getElementById('contactPhone')?.value || '';
    const subject = document.getElementById('contactSubject')?.value || '';
    const message = document.getElementById('contactMessage')?.value || '';

    const msg = `📩 *Message de ${name}*%0A%0A` +
        `📧 Email : ${email}%0A` +
        `📱 Téléphone : ${phone}%0A` +
        `📌 Sujet : ${subject}%0A` +
        `💬 Message : ${message}`;

    window.open(`https://wa.me/21651555603?text=${msg}`, '_blank');
}

// =========================================================
// 8bis. MENU MOBILE (HAMBURGER)
// =========================================================
function closeMobileNav() {
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('navOverlay');
    const btn = document.getElementById('hamburgerBtn');
    navLinks?.classList.remove('mobile-open');
    overlay?.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
    if (btn) btn.innerHTML = '<i class="fas fa-bars"></i>';
}

function toggleMobileNav() {
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('navOverlay');
    const btn = document.getElementById('hamburgerBtn');
    if (!navLinks) return;
    const isOpen = navLinks.classList.toggle('mobile-open');
    overlay?.classList.toggle('open', isOpen);
    btn?.setAttribute('aria-expanded', String(isOpen));
    if (btn) btn.innerHTML = isOpen ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
}

// =========================================================
// 9. INIT
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Menu mobile
    document.getElementById('hamburgerBtn')?.addEventListener('click', toggleMobileNav);
    document.getElementById('navOverlay')?.addEventListener('click', closeMobileNav);
    document.getElementById('navLinks')?.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMobileNav);
    });

    // Navigation
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const page = el.dataset.page;
            if (page) navigateTo(page);
        });
    });

    // Catégories de l'accueil
    document.querySelectorAll('.cat-card').forEach(el => {
        el.addEventListener('click', () => {
            const page = el.dataset.page;
            if (page) navigateTo(page);
        });
    });

    // Filtres
    document.querySelectorAll('.cat-filter, #priceRange, .size-chip').forEach(el => {
        el.addEventListener('change', filterProducts);
        if (el.classList.contains('size-chip')) {
            el.addEventListener('click', function() {
                this.classList.toggle('active');
                filterProducts();
            });
        }
    });
    document.getElementById('priceRange')?.addEventListener('input', function() {
        document.getElementById('priceValue').textContent = this.value;
        filterProducts();
    });
    document.getElementById('sortSelect')?.addEventListener('change', filterProducts);
    document.getElementById('resetFilters')?.addEventListener('click', () => {
        document.querySelectorAll('.cat-filter').forEach(cb => cb.checked = true);
        document.querySelectorAll('.size-chip').forEach(el => el.classList.remove('active'));
        document.querySelector('.size-chip[data-size="S"]')?.classList.add('active');
        document.getElementById('priceRange').value = 500;
        document.getElementById('priceValue').textContent = '500';
        filterProducts();
    });

    // Modal et panier
    document.getElementById('productModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    document.getElementById('cartOverlay').addEventListener('click', function(e) {
        if (e.target === this) toggleCart();
    });

    // Initialisation
    navigateTo('home');
    updateCartUI();
});
