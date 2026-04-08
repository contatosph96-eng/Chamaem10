// Verificação de segurança: checa se o administrador fez login
if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// --- CONFIGURAÇÃO DO BANCO DE DADOS (Python API) ---
const API_URL = "https://neguepython.pythonanywhere.com";
const STORE_ID = "chamaem10"; // Identificador fixo para sua loja

let inventory = [];
let sales = [];
let requests = [];

async function loadCloudData() {
  try {
    const response = await fetch(`${API_URL}/load/${STORE_ID}`);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro do Servidor ${response.status}:\n${errText}`);
    }
    return await response.json();
  } catch (error) {
    alert(`⚠️ ERRO DE CONEXÃO:\n${error.message}\n\nSe o erro for "Failed to fetch", é problema de CORS. Se for Erro 500, o PythonAnywhere está quebrado.`);
    console.error('Erro de conexão com a API:', error);
    return {
      inventory: null,
      sales: [],
      requests: []
    };
  }
}

async function saveCloudData() {
  const data = { inventory, sales, requests };
  try {
    const response = await fetch(`${API_URL}/save/${STORE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erro ao salvar na API');
    console.log("Dados sincronizados com NeguePython!");
  } catch (error) {
    alert('⚠️ ERRO AO SALVAR: A nuvem não recebeu os dados. Aperte F12 para ver o erro no console.');
    console.error('Erro ao salvar na API:', error);
  }
}

async function initAdminApp() {
  const data = await loadCloudData();
  inventory = data.inventory || [
    { id: 1, name: 'iPhone 15 Pro', price: 7299.00, stock: 5, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692846360609' },
    { id: 2, name: 'AirPods Pro', price: 1899.00, stock: 12, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1694014871985' },
    { id: 3, name: 'Carregador Turbo 35W', price: 249.00, stock: 0, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/HQ122?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1654031027103' }
  ];
  sales = data.sales || [];
  requests = data.requests || [];
  
  renderInventory();
  renderDashboardStats();
  renderRequests();
  addModelBlock(); // Inicia com um bloco de modelo
}

// Função para atualizar os números de estatísticas financeiras
function renderDashboardStats() {
  const statVendasHoje = document.getElementById('stat-vendas-hoje');
  const statLucroMensal = document.getElementById('stat-lucro-mensal');
  const statLucroAnual = document.getElementById('stat-lucro-anual');
  if (!statVendasHoje) return;

  const today = new Date().toLocaleDateString('pt-BR');
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let salesToday = 0, profitMonth = 0, profitYear = 0;

  sales.forEach(sale => {
    const saleDate = new Date(sale.timestamp);
    if (sale.date === today) salesToday++;
    if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) profitMonth += sale.price;
    if (saleDate.getFullYear() === currentYear) profitYear += sale.price;
  });

  statVendasHoje.innerText = salesToday;
  statLucroMensal.innerText = `R$ ${profitMonth.toFixed(2).replace('.', ',')}`;
  statLucroAnual.innerText = `R$ ${profitYear.toFixed(2).replace('.', ',')}`;
}

const inventoryTableBody = document.querySelector('#inventory-table tbody');
const addProductForm = document.getElementById('add-product-form');

let editingProductId = null;
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const modelsContainer = document.getElementById('models-container');
const btnAddModel = document.getElementById('btn-add-model');

if (btnAddModel) btnAddModel.addEventListener('click', () => addModelBlock());

// Função estabilizadora para não quebrar produtos já cadastrados antigos
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

function addModelBlock(model = {}) {
  const modelDiv = document.createElement('div');
  modelDiv.className = 'model-block';
  modelDiv.style.cssText = "border: 1px solid rgba(17,17,20,0.12); padding: 1rem; border-radius: 0.5rem; background: #fafafa;";
  modelDiv.innerHTML = `
    <div style="display: flex; gap: 0.5rem; align-items: end; margin-bottom: 1rem;">
      <label style="flex:1; margin:0; font-size:0.85rem; font-weight:600;">Nome do Modelo <input type="text" class="model-name" value="${model.name || ''}" required placeholder="Ex: iPhone 15 Pro" style="width: 100%; padding: 0.5rem; margin-top: 0.3rem; border: 1px solid rgba(17,17,20,0.12); border-radius: 0.4rem;"></label>
      <button type="button" class="btn-secondary" onclick="this.parentElement.parentElement.remove()" style="padding: 0.5rem 0.8rem; color: #c92a2a;">Excluir Modelo</button>
    </div>
    <div style="margin-left: 1rem; padding-left: 1rem; border-left: 2px solid #e5e5ea;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.9rem; font-weight: 600;">Cores deste modelo</span>
        <button type="button" class="btn-secondary btn-add-color-to-model" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">+ Adicionar Cor</button>
      </div>
      <div class="colors-container" style="display: flex; flex-direction: column; gap: 1rem;"></div>
    </div>
  `;
  const colorsContainer = modelDiv.querySelector('.colors-container');
  modelDiv.querySelector('.btn-add-color-to-model').addEventListener('click', () => addColorBlock(colorsContainer));
  if (model.colors && model.colors.length > 0) model.colors.forEach(c => addColorBlock(colorsContainer, c));
  else addColorBlock(colorsContainer);
  if (modelsContainer) modelsContainer.appendChild(modelDiv);
}

function addColorBlock(container, color = {}) {
  const colorDiv = document.createElement('div');
  colorDiv.className = 'color-block';
  colorDiv.style.cssText = "border: 1px solid rgba(17,17,20,0.08); padding: 1rem; border-radius: 0.5rem; background: #fff;";
  colorDiv.innerHTML = `
    <div style="display: flex; gap: 0.5rem; align-items: end; margin-bottom: 1rem; flex-wrap: wrap;">
      <label style="flex:1; margin:0; font-size:0.85rem;">Nome da Cor <input type="text" class="color-name" value="${color.name || ''}" required style="width: 100%; padding: 0.4rem; margin-top: 0.2rem; border: 1px solid rgba(17,17,20,0.12); border-radius: 0.4rem;"></label>
      <label style="width: 50px; margin:0; font-size:0.85rem;">Tom <input type="color" class="color-hex" value="${color.hex || '#000000'}" required style="width: 100%; height: 34px; padding: 0; margin-top: 0.2rem; border: none; border-radius: 0.4rem; cursor: pointer; background: transparent;"></label>
      <label style="flex:2; margin:0; font-size:0.85rem;">Link da Imagem <input type="url" class="color-image" value="${color.image || ''}" required placeholder="URL da foto" style="width: 100%; padding: 0.4rem; margin-top: 0.2rem; border: 1px solid rgba(17,17,20,0.12); border-radius: 0.4rem;"></label>
      <button type="button" class="btn-secondary" onclick="this.parentElement.parentElement.remove()" style="padding: 0.4rem 0.8rem; color: #c92a2a;">Remover Cor</button>
    </div>
    <div style="margin-left: 1rem; padding-left: 1rem; border-left: 2px solid #e5e5ea;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.85rem; font-weight: 500;">Armazenamentos e Preços</span>
        <button type="button" class="btn-secondary btn-add-storage-to-color" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">+ Add Armazenamento</button>
      </div>
      <div class="storages-container" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
    </div>
  `;
  const storagesContainer = colorDiv.querySelector('.storages-container');
  colorDiv.querySelector('.btn-add-storage-to-color').addEventListener('click', () => addStorageBlock(storagesContainer));
  if (color.storages && color.storages.length > 0) color.storages.forEach(s => addStorageBlock(storagesContainer, s));
  else addStorageBlock(storagesContainer);
  container.appendChild(colorDiv);
}

function addStorageBlock(container, storage = {}) {
  const storageDiv = document.createElement('div');
  storageDiv.className = 'storage-block';
  storageDiv.style.cssText = "display: flex; gap: 0.5rem; align-items: end;";
  storageDiv.innerHTML = `
    <label style="flex:1; margin:0; font-size:0.8rem;">Capacidade <input type="text" class="storage-size" value="${storage.size || ''}" required placeholder="Ex: 128GB" style="width: 100%; padding: 0.4rem; margin-top: 0.2rem; border: 1px solid rgba(17,17,20,0.12); border-radius: 0.4rem;"></label>
    <label style="flex:1; margin:0; font-size:0.8rem;">Preço (R$) <input type="number" step="0.01" class="storage-price" value="${storage.price !== undefined ? storage.price : ''}" required style="width: 100%; padding: 0.4rem; margin-top: 0.2rem; border: 1px solid rgba(17,17,20,0.12); border-radius: 0.4rem;"></label>
    <label style="flex:1; margin:0; font-size:0.8rem;">Estoque <input type="number" class="storage-stock" value="${storage.stock !== undefined ? storage.stock : ''}" required style="width: 100%; padding: 0.4rem; margin-top: 0.2rem; border: 1px solid rgba(17,17,20,0.12); border-radius: 0.4rem;"></label>
    <button type="button" class="btn-secondary" onclick="this.parentElement.remove()" style="padding: 0.4rem 0.6rem; color: #c92a2a; margin-bottom: 2px;">X</button>
  `;
  container.appendChild(storageDiv);
}

// Função para renderizar a tabela na tela com o status do estoque
function renderInventory() {
  inventoryTableBody.innerHTML = '';
  
  inventory.forEach(item => {
    const tr = document.createElement('tr');
    
    // Etiqueta visual que o cliente veria dependendo da disponibilidade
    const stockStatus = item.stock > 0 
      ? `<span class="stock-badge stock-in">${item.stock} em estoque</span>`
      : `<span class="stock-badge stock-out">Esgotado</span>`;
      
    const normModels = getNormalizedModels(item);
    const modelsList = normModels.map(m => m.name).join(', ');

    tr.innerHTML = `
      <td>${item.name} ${modelsList ? `<br><small style="color:#6e6e73">${modelsList}</small>` : ''}</td>
      <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
      <td>${stockStatus}</td>
      <td style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="editProduct(${item.id})">Editar</button>
        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; color: #c92a2a;" onclick="deleteProduct(${item.id})">Excluir</button>
      </td>
    `;
    inventoryTableBody.appendChild(tr);
  });
}

// Função para aumentar ou diminuir quantidade em estoque
window.updateStock = function(id, change) {
  const product = inventory.find(p => p.id === id);
  if (product) {
    product.stock += change;
    if (product.stock < 0) product.stock = 0; // Impede que o estoque fique negativo
    saveCloudData();
    renderInventory();
  }
};

// Função para preparar o formulário para edição
window.editProduct = function(id) {
  const product = inventory.find(p => p.id === id);
  if (product) {
    editingProductId = id;
    document.getElementById('prod-name').value = product.name;
    
    if (modelsContainer) modelsContainer.innerHTML = '';
    const normModels = getNormalizedModels(product);
    normModels.forEach(m => addModelBlock(m));

    if(formTitle) formTitle.innerText = 'Editar Produto';
    if(submitBtn) submitBtn.innerText = 'Atualizar Produto';
    if(cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
    
    // Rola a tela suavemente para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// Reseta o formulário para o estado padrão de adição
function resetFormState() {
  editingProductId = null;
  addProductForm.reset();
  if(formTitle) formTitle.innerText = 'Adicionar Novo Produto';
  if(submitBtn) submitBtn.innerText = 'Salvar Produto';
  if(cancelEditBtn) cancelEditBtn.style.display = 'none';
  if(modelsContainer) {
    modelsContainer.innerHTML = '';
    addModelBlock(); 
  }
}

// Função para excluir um produto
window.deleteProduct = function(id) {
  if (confirm('Tem certeza que deseja excluir este produto da loja?')) {
    inventory = inventory.filter(p => p.id !== id);
    saveCloudData();
    renderInventory();
    if (editingProductId === id) {
      resetFormState();
    }
  }
};

if (cancelEditBtn) cancelEditBtn.addEventListener('click', resetFormState);

// Lógica para adicionar ou editar produtos através do formulário
if (addProductForm) {
  addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const parsedModels = Array.from(document.querySelectorAll('.model-block')).map(modelBlock => {
      return {
        name: modelBlock.querySelector('.model-name').value,
        colors: Array.from(modelBlock.querySelectorAll('.color-block')).map(colorBlock => {
          return {
            name: colorBlock.querySelector('.color-name').value,
            hex: colorBlock.querySelector('.color-hex').value,
            image: colorBlock.querySelector('.color-image').value,
            storages: Array.from(colorBlock.querySelectorAll('.storage-block')).map(storageBlock => ({
              size: storageBlock.querySelector('.storage-size').value,
              price: parseFloat(storageBlock.querySelector('.storage-price').value) || 0,
              stock: parseInt(storageBlock.querySelector('.storage-stock').value) || 0
            }))
          };
        })
      };
    });

    if (parsedModels.length === 0) {
      alert('É obrigatório adicionar pelo menos um modelo com cor e armazenamento.');
      return;
    }

    let totalStock = 0;
    let basePrice = 0;
    let baseImage = '';
    if (parsedModels[0] && parsedModels[0].colors[0]) {
      baseImage = parsedModels[0].colors[0].image;
      if (parsedModels[0].colors[0].storages[0]) {
        basePrice = parsedModels[0].colors[0].storages[0].price;
      }
    }
    parsedModels.forEach(m => m.colors.forEach(c => c.storages.forEach(s => totalStock += s.stock)));

    if (editingProductId) {
      const product = inventory.find(p => p.id === editingProductId);
      if (product) {
        product.name = document.getElementById('prod-name').value;
        product.models = parsedModels;
        product.price = basePrice;
        product.stock = totalStock;
        product.image = baseImage;
        alert('Produto atualizado com sucesso!');
      }
    } else {
      const newProduct = {
        id: inventory.length > 0 ? Math.max(...inventory.map(p => p.id)) + 1 : 1,
        name: document.getElementById('prod-name').value,
        models: parsedModels,
        price: basePrice,
        stock: totalStock,
        image: baseImage
      };
      inventory.push(newProduct);
      alert('Produto adicionado ao estoque com sucesso!');
    }

    saveCloudData();
    renderInventory();
    resetFormState();
  });
}

// Lógica para Renderizar Solicitações de Orçamento
const requestsTableBody = document.querySelector('#requests-table tbody');

function renderRequests() {
  if (!requestsTableBody) return;
  requestsTableBody.innerHTML = '';

  if (requests.length === 0) {
    requestsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6e6e73;">Nenhuma solicitação no momento.</td></tr>';
    return;
  }

  requests.forEach(req => {
    const tr = document.createElement('tr');
    const cleanPhone = req.phone.replace(/\D/g, ''); // Remove formatações para link do WhatsApp
    
    tr.innerHTML = `
      <td style="white-space: nowrap;">${req.date}</td>
      <td><strong>${req.name}</strong></td>
      <td style="white-space: nowrap;">
        <div style="margin-bottom: 0.25rem;">📞 ${req.phone}</div>
        ${req.email ? `<div style="font-size: 0.85rem; color: #6e6e73;">✉️ ${req.email}</div>` : ''}
      </td>
      <td><div style="max-width: 300px; padding: 0.5rem 0;">${req.message}</div></td>
      <td style="display: flex; gap: 0.5rem; flex-direction: column;">
        <a href="https://wa.me/55${cleanPhone}" target="_blank" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; text-align: center;">Chamar Whats</a>
        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="deleteRequest(${req.id})">Excluir</button>
      </td>
    `;
    requestsTableBody.appendChild(tr);
  });
}

window.deleteRequest = function(id) {
  requests = requests.filter(req => req.id !== id);
  saveCloudData();
  renderRequests();
};

// --- Lógica de Venda e Extrato Financeiro ---
const btnNewSale = document.getElementById('btn-new-sale');
const saleModal = document.getElementById('sale-modal');
const closeSaleModal = document.getElementById('close-sale-modal');
const saleForm = document.getElementById('sale-form');
const saleProductId = document.getElementById('sale-product-id');
const saleModelWrapper = document.getElementById('sale-model-wrapper');
const saleModel = document.getElementById('sale-model');
const saleColorWrapper = document.getElementById('sale-color-wrapper');
const saleColor = document.getElementById('sale-color');
const saleStorageWrapper = document.getElementById('sale-storage-wrapper');
const saleStorage = document.getElementById('sale-storage');

// Abrir modal de venda e carregar produtos em estoque
if (btnNewSale) {
  btnNewSale.addEventListener('click', () => {
    saleProductId.innerHTML = '<option value="">-- Selecione o produto --</option>';
    inventory.forEach(item => {
      if (item.stock > 0) {
        saleProductId.innerHTML += `<option value="${item.id}">${item.name}</option>`;
      }
    });
    saleModelWrapper.style.display = 'none';
    saleColorWrapper.style.display = 'none';
    saleStorageWrapper.style.display = 'none';
    saleModel.removeAttribute('required');
    saleColor.removeAttribute('required');
    saleStorage.removeAttribute('required');
    saleModal.style.display = 'flex';
  });
}
if (closeSaleModal) closeSaleModal.addEventListener('click', () => saleModal.style.display = 'none');

// Lógica em cascata para os seletores
if (saleProductId) {
  saleProductId.addEventListener('change', (e) => {
    const product = inventory.find(p => p.id === parseInt(e.target.value));
    saleColorWrapper.style.display = 'none';
    saleStorageWrapper.style.display = 'none';
    saleColor.removeAttribute('required');
    saleStorage.removeAttribute('required');
    if (product) {
      const normModels = getNormalizedModels(product);
      saleModel.innerHTML = '<option value="">-- Selecione o modelo --</option>';
      normModels.forEach((m, i) => saleModel.innerHTML += `<option value="${i}">${m.name}</option>`);
      saleModelWrapper.style.display = 'block';
      saleModel.setAttribute('required', 'true');
    } else {
      saleModelWrapper.style.display = 'none';
      saleModel.removeAttribute('required');
    }
  });
}
if (saleModel) {
  saleModel.addEventListener('change', (e) => {
    const product = inventory.find(p => p.id === parseInt(saleProductId.value));
    saleStorageWrapper.style.display = 'none';
    saleStorage.removeAttribute('required');
    if (product && e.target.value !== '') {
      const m = getNormalizedModels(product)[parseInt(e.target.value)];
      saleColor.innerHTML = '<option value="">-- Selecione a cor --</option>';
      m.colors.forEach((c, i) => saleColor.innerHTML += `<option value="${i}">${c.name}</option>`);
      saleColorWrapper.style.display = 'block';
      saleColor.setAttribute('required', 'true');
    } else { saleColorWrapper.style.display = 'none'; saleColor.removeAttribute('required'); }
  });
}
if (saleColor) {
  saleColor.addEventListener('change', (e) => {
    const product = inventory.find(p => p.id === parseInt(saleProductId.value));
    if (product && saleModel.value !== '' && e.target.value !== '') {
      const c = getNormalizedModels(product)[parseInt(saleModel.value)].colors[parseInt(e.target.value)];
      saleStorage.innerHTML = '<option value="">-- Selecione o armazenamento --</option>';
      c.storages.forEach((s, i) => saleStorage.innerHTML += `<option value="${i}" ${s.stock <= 0 ? 'disabled' : ''}>${s.size} - R$ ${s.price.toFixed(2).replace('.', ',')} (${s.stock > 0 ? s.stock + ' em estoque' : 'Esgotado'})</option>`);
      saleStorageWrapper.style.display = 'block';
      saleStorage.setAttribute('required', 'true');
    } else { saleStorageWrapper.style.display = 'none'; saleStorage.removeAttribute('required'); }
  });
}

// Confirmar Venda
if (saleForm) {
  saleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const product = inventory.find(p => p.id === parseInt(saleProductId.value));

    if (product && product.stock > 0) {
      const normModels = getNormalizedModels(product);
      const m = normModels[parseInt(saleModel.value)];
      const c = m ? m.colors[parseInt(saleColor.value)] : null;
      const s = c ? c.storages[parseInt(saleStorage.value)] : null;

      if (!m || !c || !s) {
        alert("Por favor, selecione todas as variações.");
        return;
      }
      if (s.stock <= 0) {
        alert("Esta variação está esgotada!");
        return;
      }

      s.stock--;
      product.models = normModels;
      product.stock = Math.max(0, product.stock - 1);

      const now = new Date();
      let saleName = product.name;
      if (m.name !== 'Padrão') saleName += ` ${m.name}`;
      if (c.name !== 'Única') saleName += ` - ${c.name}`;
      if (s.size !== 'Único') saleName += ` (${s.size})`;

      const newSale = {
        id: Date.now(),
        productId: product.id,
        productName: saleName,
        price: s.price,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.getTime()
      };

      sales.push(newSale); // Registra a venda
      saveCloudData();

      renderInventory();
      renderDashboardStats();
      saleModal.style.display = 'none';
    }
  });
}

// Extrato Financeiro
const btnViewFinance = document.getElementById('btn-view-finance');
const financeModal = document.getElementById('finance-modal');
const closeFinanceModal = document.getElementById('close-finance-modal');
const financeMonthInput = document.getElementById('finance-month');
const financeTableBody = document.querySelector('#finance-table tbody');
const financeTotal = document.getElementById('finance-total');

if (btnViewFinance) {
  btnViewFinance.addEventListener('click', () => {
    const now = new Date();
    financeMonthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    renderFinanceTable();
    financeModal.style.display = 'flex';
  });
}
if (closeFinanceModal) closeFinanceModal.addEventListener('click', () => financeModal.style.display = 'none');
if (financeMonthInput) financeMonthInput.addEventListener('change', renderFinanceTable);

function renderFinanceTable() {
  if (!financeMonthInput.value) return;
  const [year, month] = financeMonthInput.value.split('-');
  let total = 0;
  financeTableBody.innerHTML = '';
  const filteredSales = sales.filter(s => { const d = new Date(s.timestamp); return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month); });
  if (filteredSales.length === 0) { financeTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #6e6e73; padding: 2rem;">Nenhuma venda neste mês.</td></tr>'; } 
  else { filteredSales.forEach(s => { total += s.price; financeTableBody.innerHTML += `<tr><td style="white-space: nowrap;">${s.date} ${s.time}</td><td>${s.productName}</td><td style="white-space: nowrap;">R$ ${s.price.toFixed(2).replace('.', ',')}</td><td><button class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="openSaleAction(${s.id})">Alterar</button></td></tr>`; }); }
  financeTotal.innerText = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
}

// --- Lógica de Edição e Exclusão de Vendas (Segurança) ---
const saleActionModal = document.getElementById('sale-action-modal');
const closeActionModal = document.getElementById('close-action-modal');
const btnActionEdit = document.getElementById('btn-action-edit');
const btnActionDelete = document.getElementById('btn-action-delete');

const saleEditModal = document.getElementById('sale-edit-modal');
const closeSaleEditModal = document.getElementById('close-sale-edit-modal');
const saleEditForm = document.getElementById('sale-edit-form');

let currentSaleActionId = null;
const ADMIN_PASS = '19554976'; // A mesma senha utilizada no login

window.openSaleAction = function(id) {
  currentSaleActionId = id;
  saleActionModal.style.display = 'flex';
};

if (closeActionModal) closeActionModal.addEventListener('click', () => saleActionModal.style.display = 'none');
if (closeSaleEditModal) closeSaleEditModal.addEventListener('click', () => saleEditModal.style.display = 'none');

if (btnActionDelete) {
  btnActionDelete.addEventListener('click', () => {
    saleActionModal.style.display = 'none';
    const pass = prompt('AÇÃO SENSÍVEL: Digite a senha do Admin para confirmar a exclusão:');
    if (pass === ADMIN_PASS) {
      sales = sales.filter(s => s.id !== currentSaleActionId);
      saveCloudData();
      renderFinanceTable();
      renderDashboardStats();
      alert('A venda foi excluída e os saldos foram recalculados!');
    } else if (pass !== null) {
      alert('Senha incorreta! Operação cancelada.');
    }
  });
}

if (btnActionEdit) {
  btnActionEdit.addEventListener('click', () => {
    saleActionModal.style.display = 'none';
    const pass = prompt('AÇÃO SENSÍVEL: Digite a senha do Admin para liberar a edição:');
    if (pass === ADMIN_PASS) {
      const sale = sales.find(s => s.id === currentSaleActionId);
      if (sale) {
        document.getElementById('edit-sale-id').value = sale.id;
        
        const editProductSelect = document.getElementById('edit-sale-product');
        editProductSelect.innerHTML = '';
        let hasCurrent = false;
        inventory.forEach(item => {
          if (item.name === sale.productName) hasCurrent = true;
          editProductSelect.innerHTML += `<option value="${item.name}">${item.name}</option>`;
        });
        if (!hasCurrent) {
          editProductSelect.innerHTML += `<option value="${sale.productName}">${sale.productName}</option>`;
        }
        editProductSelect.value = sale.productName;

        document.getElementById('edit-sale-price').value = sale.price;
        document.getElementById('edit-sale-date').value = sale.date;
        document.getElementById('edit-sale-time').value = sale.time;
        saleEditModal.style.display = 'flex';
      }
    } else if (pass !== null) {
      alert('Senha incorreta! Operação cancelada.');
    }
  });
}

// Atualiza o preço automaticamente se o Admin trocar o aparelho na lista de edição
const editProductSelect = document.getElementById('edit-sale-product');
if (editProductSelect) {
  editProductSelect.addEventListener('change', (e) => {
    const selectedProduct = inventory.find(p => p.name === e.target.value);
    if (selectedProduct) document.getElementById('edit-sale-price').value = selectedProduct.price;
  });
}

if (saleEditForm) {
  saleEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const sale = sales.find(s => s.id === parseInt(document.getElementById('edit-sale-id').value));
    if (sale) {
      sale.productName = document.getElementById('edit-sale-product').value;
      sale.price = parseFloat(document.getElementById('edit-sale-price').value);
      sale.date = document.getElementById('edit-sale-date').value;
      sale.time = document.getElementById('edit-sale-time').value;
      saveCloudData();
      renderFinanceTable();
      renderDashboardStats();
      saleEditModal.style.display = 'none';
    }
  });
}

// Lógica de Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('isAdminLoggedIn'); // Remove a sessão ativa
    window.location.href = 'index.html'; // Redireciona para a loja
  });
}

// Lógica do Botão de Salvar Manualmente
const forceSaveBtn = document.getElementById('force-save-btn');
if (forceSaveBtn) {
  forceSaveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    forceSaveBtn.innerText = 'Salvando...';
    await saveCloudData();
    forceSaveBtn.innerText = 'Salvar Dados';
    alert('Tudo certo! Seus dados foram salvos e sincronizados com a nuvem com sucesso.');
  });
}

// Inicializa o painel carregando os dados da nuvem
initAdminApp();
