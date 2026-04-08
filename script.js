// --- CONFIGURAÇÃO DO BANCO DE DADOS (Python API) ---
const API_URL = "https://neguepython.pythonanywhere.com";
const STORE_ID = "chamaem10"; // Identificador fixo para sua loja

async function loadCloudData() {
  try {
    const response = await fetch(`${API_URL}/load/${STORE_ID}`);
    if (!response.ok) throw new Error('Erro ao carregar dados da API');
    return await response.json();
  } catch (error) {
    console.error('⚠️ Falha ao conectar na API:', error);
    return {
      inventory: null,
      requests: []
    };
  }
}

async function saveCloudData(data) {
  try {
    await fetch(`${API_URL}/save/${STORE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log("Dados sincronizados com NeguePython!");
  } catch (error) {
    console.error('Erro ao salvar na API:', error);
  }
}

const form = document.getElementById('budget-form');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    // Coleta os valores digitados pelo cliente
    const name = form.elements['name'].value;
    const phone = form.elements['phone'].value;
    const email = form.elements['email'].value;
    const message = form.elements['message'].value;
    
    const newRequest = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      name,
      phone,
      email,
      message
    };
    
    const data = await loadCloudData();
    const requests = data.requests || [];
    requests.push(newRequest);
    await saveCloudData({ ...data, requests });
    
    alert('Sua solicitação foi enviada com sucesso! Em breve entraremos em contato.');
    form.reset();
  });
}

// Lógica de login secreto através do ponto (.) no rodapé
const secretLoginDot = document.getElementById('secret-login');
if (secretLoginDot) {
  secretLoginDot.addEventListener('click', () => {
    const username = prompt('Área restrita. Digite o Login:');
    if (username === 'Chamaem10Admin') {
      const password = prompt('Digite a Senha:');
      if (password === '19554976') {
        sessionStorage.setItem('isAdminLoggedIn', 'true'); // Salva a sessão ativa
        window.location.href = 'admin.html'; // Redireciona em caso de sucesso
      } else {
        alert('Senha incorreta!');
      }
    } else if (username !== null && username !== '') {
      alert('Usuário não reconhecido!');
    }
  });
}

// Lógica do Modal de Seleção de WhatsApp
const waSelectorModal = document.getElementById('wa-selector-modal');
const closeWaModalBtn = document.getElementById('close-wa-modal');
const waSelectorBtns = document.querySelectorAll('.wa-selector-btn');
const waLinkMaxwel = document.getElementById('wa-link-maxwel');
const waLinkPaulo = document.getElementById('wa-link-paulo');

if (waSelectorBtns.length > 0 && waSelectorModal) {
  waSelectorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // Limpa qualquer mensagem de texto anterior para o contato genérico
      if (waLinkMaxwel) waLinkMaxwel.href = "https://wa.me/5527996098095";
      if (waLinkPaulo) waLinkPaulo.href = "https://wa.me/5533998544278";
      waSelectorModal.style.display = 'flex';
    });
  });
}

if (closeWaModalBtn) {
  closeWaModalBtn.addEventListener('click', () => {
    waSelectorModal.style.display = 'none';
  });
}

// --- Lógica da Loja (Renderizar Produtos e Checkout) ---

const WHATSAPP_NUMBER = "5533998544278";

// Renderizar o carrossel de produtos na vitrine
async function renderStorefront() {
  const container = document.getElementById('store-products-container');
  if (!container) return;
  
  const data = await loadCloudData();
  let inventory = data.inventory;
  
  if (!inventory || inventory.length === 0) {
    inventory = [
      { id: 1, name: 'iPhone 15 Pro', price: 7299.00, stock: 5, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692846360609' },
      { id: 2, name: 'AirPods Pro', price: 1899.00, stock: 12, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1694014871985' },
      { id: 3, name: 'Carregador Turbo 35W', price: 249.00, stock: 0, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/HQ122?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1654031027103' }
    ];
  }

  container.innerHTML = '';

  inventory.forEach(item => {
    const card = document.createElement('div');
    card.className = 'store-card';
    
    const inStock = item.stock > 0;
    const priceFormat = `R$ ${item.price.toFixed(2).replace('.', ',')}`;
    const imageHtml = item.image ? `<img src="${item.image}" alt="${item.name}" class="store-card-image">` : `<div class="store-card-placeholder"></div>`;
    
    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="price-tag">${priceFormat}</div>
      ${imageHtml}
      <div class="buy-action">
        ${inStock 
          ? `<button class="btn-primary" onclick="openCheckout(${item.id}, '${item.name}', '${priceFormat}')">Comprar</button>` 
          : `<span class="out-of-stock-text">Esgotado</span>`
        }
      </div>
    `;
    container.appendChild(card);
  });
}

// Lógica do Modal de Compra
const checkoutModal = document.getElementById('checkout-modal');
const closeModalBtn = document.getElementById('close-modal');
const checkoutForm = document.getElementById('checkout-form');

window.openCheckout = function(id, name, price) {
  document.getElementById('order-summary').innerHTML = `1x ${name} <br><span style="color:#6e6e73; font-size: 0.95rem;">Total: ${price}</span>`;
  document.getElementById('checkout-product-id').value = id;
  document.getElementById('checkout-product-id').dataset.name = name;
  document.getElementById('checkout-product-id').dataset.price = price;
  checkoutModal.style.display = 'flex';
};

if (closeModalBtn) closeModalBtn.addEventListener('click', () => checkoutModal.style.display = 'none');

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientName = document.getElementById('checkout-name').value;
    const prodName = document.getElementById('checkout-product-id').dataset.name;
    const prodPrice = document.getElementById('checkout-product-id').dataset.price;
    
    const message = `Olá! Tudo bem? Meu nome é ${clientName}.\n\nGostaria de prosseguir com a compra do produto:\n📦 Produto: ${prodName}\n💵 Valor: ${prodPrice}\n\nGostaria de Saber mais informações!`;
    
    // Atualiza os links com a mensagem formatada
    if (waLinkMaxwel) waLinkMaxwel.href = `https://wa.me/5527996098095?text=${encodeURIComponent(message)}`;
    if (waLinkPaulo) waLinkPaulo.href = `https://wa.me/5533998544278?text=${encodeURIComponent(message)}`;
    
    checkoutModal.style.display = 'none';
    if (waSelectorModal) waSelectorModal.style.display = 'flex';
  });
}

// Inicializa a loja ao carregar a página
document.addEventListener('DOMContentLoaded', renderStorefront);
