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

let globalInventory = [];

// Função para normalizar dados mantendo compatibilidade
function getNormalizedModels(product) {
  if (product.models && product.models.length > 0 && typeof product.models[0] === 'object') return product.models;
  const mName = (product.models && product.models.length > 0 && typeof product.models[0] === 'string') ? product.models[0] : (product.model || 'Padrão');
  const fakeModel = { name: mName, colors: [] };
  const colorsToUse = (product.colors && product.colors.length > 0) ? product.colors : [{name: 'Única', hex: '#000000', image: product.image, price: product.price, stock: product.stock}];
  const storagesToUse = (product.storages && product.storages.length > 0) ? product.storages : [];
  colorsToUse.forEach(c => {
    let finalStorages = storagesToUse.map(s => ({ size: s.size, price: s.price, stock: c.stock !== undefined ? c.stock : product.stock }));
    if (finalStorages.length === 0) finalStorages = [{ size: 'Único', price: c.price !== undefined ? c.price : product.price, stock: c.stock !== undefined ? c.stock : product.stock }];
    fakeModel.colors.push({ name: c.name, hex: c.hex || '#000000', image: c.image || product.image, storages: finalStorages });
  });
  return [fakeModel];
}

// Renderizar o carrossel de produtos na vitrine
async function renderStorefront() {
  const container = document.getElementById('store-products-container');
  if (!container) return;
  
  const data = await loadCloudData();
  globalInventory = data.inventory;
  
  if (!globalInventory || globalInventory.length === 0) {
    globalInventory = [
      { id: 1, name: 'iPhone 15 Pro', price: 7299.00, stock: 5, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692846360609' },
      { id: 2, name: 'AirPods Pro', price: 1899.00, stock: 12, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1694014871985' },
      { id: 3, name: 'Carregador Turbo 35W', price: 249.00, stock: 0, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/HQ122?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1654031027103' }
    ];
  }

  container.innerHTML = '';

  globalInventory.forEach(item => {
    const card = document.createElement('div');
    card.className = 'store-card';
    
    const normModels = getNormalizedModels(item);
    let displayPrice = item.price;
    let displayImage = item.image;
    let modelsText = normModels.map(m => m.name).join(', ');

    if (normModels.length > 0 && normModels[0].colors.length > 0) {
      displayImage = normModels[0].colors[0].image || displayImage;
      if (normModels[0].colors[0].storages.length > 0) displayPrice = normModels[0].colors[0].storages[0].price;
    }

    const inStock = item.stock > 0;
    const priceFormat = `R$ ${displayPrice.toFixed(2).replace('.', ',')}`;
    const imageHtml = displayImage ? `<img src="${displayImage}" alt="${item.name}" class="store-card-image">` : `<div class="store-card-placeholder"></div>`;
    
    card.innerHTML = `
      <h3>${item.name} ${modelsText ? `<span style="font-weight:400; font-size:1.1rem; color:#6e6e73;">${modelsText}</span>` : ''}</h3>
      <div class="price-tag">${priceFormat}</div>
      ${imageHtml}
      <div class="buy-action">
        ${inStock ? `<button class="btn-primary" onclick="openCheckout(${item.id})">Comprar</button>` : `<span class="out-of-stock-text">Esgotado</span>`}
      </div>
    `;
    container.appendChild(card);
  });
}

// Lógica do Modal de Compra
const checkoutModal = document.getElementById('checkout-modal');
const closeModalBtn = document.getElementById('close-modal');
const checkoutForm = document.getElementById('checkout-form');

window.openCheckout = function(id) {
  const product = globalInventory.find(p => p.id === id);
  if (!product) return;

  const modalImg = document.getElementById('checkout-img');
  const modalTitle = document.getElementById('checkout-title');
  const modalPrice = document.getElementById('checkout-price');

  const normModels = getNormalizedModels(product);
  
  const modelSection = document.getElementById('checkout-model-section');
  const modelOptions = document.getElementById('checkout-model-options');
  const modelNameDisplay = document.getElementById('checkout-model-name-display');

  const colorSection = document.getElementById('checkout-color-section');
  const colorSwatches = document.getElementById('checkout-color-swatches');
  const colorNameDisplay = document.getElementById('checkout-color-name-display');
  
  const storageSection = document.getElementById('checkout-storage-section');
  const storageOptions = document.getElementById('checkout-storage-options');
  const storageNameDisplay = document.getElementById('checkout-storage-name-display');

  let selectedModel = null;
  let selectedColor = null;
  let selectedStorage = null;

  function updatePriceAndImage() {
    if (selectedStorage) {
      const priceFormat = `R$ ${selectedStorage.price.toFixed(2).replace('.', ',')}`;
      modalPrice.innerText = priceFormat;
      document.getElementById('checkout-product-id').dataset.price = priceFormat;
    }
    if (selectedColor) {
      modalImg.src = selectedColor.image || product.image || '';
      modalImg.style.display = modalImg.src ? 'block' : 'none';
    }
  }

  function selectStorage(s, el) {
    document.querySelectorAll('#checkout-storage-options .option-box').forEach(box => box.classList.remove('active'));
    el.classList.add('active');
    selectedStorage = s;
    storageNameDisplay.innerText = s.size + (s.stock <= 0 ? ' (Esgotado)' : '');
    document.getElementById('checkout-product-id').dataset.storage = s.size;
    updatePriceAndImage();
  }

  function selectColor(c, el) {
    document.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('active'));
    el.classList.add('active');
    selectedColor = c;
    colorNameDisplay.innerText = c.name;
    document.getElementById('checkout-product-id').dataset.color = c.name;

    storageOptions.innerHTML = '';
    if (c.storages && c.storages.length > 0) {
      storageSection.style.display = 'block';
      c.storages.forEach(s => {
        const box = document.createElement('div');
        box.className = 'option-box';
        if (s.stock <= 0) box.style.opacity = '0.5';
        box.innerText = s.size;
        box.onclick = () => selectStorage(s, box);
        storageOptions.appendChild(box);
      });
      storageOptions.firstChild.click();
    } else {
      storageSection.style.display = 'none';
      selectedStorage = null;
      updatePriceAndImage();
    }
  }

  function selectModel(m, el) {
    document.querySelectorAll('#checkout-model-options .option-box').forEach(box => box.classList.remove('active'));
    el.classList.add('active');
    selectedModel = m;
    modelNameDisplay.innerText = m.name;
    document.getElementById('checkout-product-id').dataset.model = m.name;

    colorSwatches.innerHTML = '';
    if (m.colors && m.colors.length > 0) {
      colorSection.style.display = 'block';
      m.colors.forEach(c => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = c.hex || '#ccc';
        swatch.title = c.name;
        swatch.onclick = () => selectColor(c, swatch);
        colorSwatches.appendChild(swatch);
      });
      colorSwatches.firstChild.click();
    } else {
      colorSection.style.display = 'none';
      selectedColor = null;
      storageSection.style.display = 'none';
      selectedStorage = null;
      updatePriceAndImage();
    }
  }

  modalTitle.innerText = product.name;
  document.getElementById('checkout-product-id').value = id;
  document.getElementById('checkout-product-id').dataset.name = product.name;

  modelOptions.innerHTML = '';
  if (normModels.length > 0) {
    modelSection.style.display = 'block';
    normModels.forEach(m => {
      const box = document.createElement('div');
      box.className = 'option-box';
      box.innerText = m.name;
      box.onclick = () => selectModel(m, box);
      modelOptions.appendChild(box);
    });
    modelOptions.firstChild.click();
  } else {
    modelSection.style.display = 'none';
  }

  checkoutModal.style.display = 'flex';
};

if (closeModalBtn) closeModalBtn.addEventListener('click', () => checkoutModal.style.display = 'none');

if (checkoutForm) {
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientName = document.getElementById('checkout-name').value;
    const prodName = document.getElementById('checkout-product-id').dataset.name;
    const prodPrice = document.getElementById('checkout-product-id').dataset.price;
    const prodModel = document.getElementById('checkout-product-id').dataset.model;
    const prodStorage = document.getElementById('checkout-product-id').dataset.storage;
    const prodColor = document.getElementById('checkout-product-id').dataset.color;
    
    const product = globalInventory.find(p => p.id === parseInt(document.getElementById('checkout-product-id').value));
    
    const normModels = getNormalizedModels(product);
    const m = normModels.find(x => x.name === prodModel);
    if (m) {
      const c = m.colors.find(x => x.name === prodColor);
      if (c) {
        const s = c.storages.find(x => x.size === prodStorage);
        if (s && s.stock <= 0) {
           alert('Esta combinação de cor e armazenamento está esgotada.');
           return;
        }
      }
    }
    
    let message = `Olá! Tudo bem? Meu nome é ${clientName}.\n\nGostaria de prosseguir com a compra do produto:\n📦 Produto: ${prodName}\n`;
    if (prodModel) {
      message += `📱 Modelo: ${prodModel}\n`;
    }
    if (prodStorage) {
      message += `💾 Armazenamento: ${prodStorage}\n`;
    }
    if (prodColor) {
      message += `🎨 Cor: ${prodColor}\n`;
    }
    message += `💵 Valor: ${prodPrice}\n\nGostaria de Saber mais informações!`;
    
    // Atualiza os links com a mensagem formatada
    if (waLinkMaxwel) waLinkMaxwel.href = `https://wa.me/5527996098095?text=${encodeURIComponent(message)}`;
    if (waLinkPaulo) waLinkPaulo.href = `https://wa.me/5533998544278?text=${encodeURIComponent(message)}`;
    
    checkoutModal.style.display = 'none';
    if (waSelectorModal) waSelectorModal.style.display = 'flex';
  });
}

// Inicializa a loja ao carregar a página
document.addEventListener('DOMContentLoaded', renderStorefront);
