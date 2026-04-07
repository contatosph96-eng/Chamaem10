// Verificação de segurança: checa se o administrador fez login
if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// --- CONFIGURAÇÃO DO BANCO DE DADOS (JSONBin.io) ---
const CLOUD_BIN_ID = 'SEU_BIN_ID_AQUI'; // Cole o seu Bin ID aqui
const CLOUD_API_KEY = 'SUA_API_KEY_AQUI'; // Cole a sua API Key aqui

let inventory = [];
let sales = [];
let requests = [];

async function loadCloudData() {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${CLOUD_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': CLOUD_API_KEY }
    });
    if (!response.ok) throw new Error('Erro ao carregar dados');
    const json = await response.json();
    return json.record;
  } catch (error) {
    console.error('Usando dados locais (Nuvem não configurada):', error);
    return {
      inventory: JSON.parse(localStorage.getItem('chamaInventory')) || null,
      sales: JSON.parse(localStorage.getItem('chamaSales')) || [],
      requests: JSON.parse(localStorage.getItem('chamaRequests')) || []
    };
  }
}

async function saveCloudData() {
  const data = { inventory, sales, requests };
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${CLOUD_BIN_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': CLOUD_API_KEY },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Erro ao salvar na nuvem', error);
  }
  localStorage.setItem('chamaInventory', JSON.stringify(inventory));
  localStorage.setItem('chamaSales', JSON.stringify(sales));
  localStorage.setItem('chamaRequests', JSON.stringify(requests));
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

// Função para renderizar a tabela na tela com o status do estoque
function renderInventory() {
  inventoryTableBody.innerHTML = '';
  
  inventory.forEach(item => {
    const tr = document.createElement('tr');
    
    // Etiqueta visual que o cliente veria dependendo da disponibilidade
    const stockStatus = item.stock > 0 
      ? `<span class="stock-badge stock-in">${item.stock} em estoque</span>`
      : `<span class="stock-badge stock-out">Esgotado</span>`;

    tr.innerHTML = `
      <td>${item.name}</td>
      <td>R$ ${item.price.toFixed(2).replace('.', ',')}</td>
      <td>${stockStatus}</td>
      <td style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="updateStock(${item.id}, 1)">+1</button>
        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="updateStock(${item.id}, -1)">-1</button>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="editProduct(${item.id})">Editar</button>
          <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; color: #c92a2a;" onclick="deleteProduct(${item.id})">Excluir</button>
        </div>
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
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-stock').value = product.stock;
    document.getElementById('prod-image').value = product.image || '';
    
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
    
    if (editingProductId) {
      const product = inventory.find(p => p.id === editingProductId);
      if (product) {
        product.name = document.getElementById('prod-name').value;
        product.price = parseFloat(document.getElementById('prod-price').value);
        product.stock = parseInt(document.getElementById('prod-stock').value);
        product.image = document.getElementById('prod-image').value || '';
        alert('Produto atualizado com sucesso!');
      }
    } else {
      const newProduct = {
        id: inventory.length > 0 ? Math.max(...inventory.map(p => p.id)) + 1 : 1,
        name: document.getElementById('prod-name').value,
        price: parseFloat(document.getElementById('prod-price').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        image: document.getElementById('prod-image').value || ''
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

// Abrir modal de venda e carregar produtos em estoque
if (btnNewSale) {
  btnNewSale.addEventListener('click', () => {
    saleProductId.innerHTML = '<option value="">-- Selecione o produto --</option>';
    inventory.forEach(item => {
      if (item.stock > 0) {
        saleProductId.innerHTML += `<option value="${item.id}">${item.name} - R$ ${item.price.toFixed(2).replace('.',',')}</option>`;
      }
    });
    saleModal.style.display = 'flex';
  });
}
if (closeSaleModal) closeSaleModal.addEventListener('click', () => saleModal.style.display = 'none');

// Confirmar Venda
if (saleForm) {
  saleForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const product = inventory.find(p => p.id === parseInt(saleProductId.value));

    if (product && product.stock > 0) {
      product.stock--; // Subtrai do estoque

      const now = new Date();
      const newSale = {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        price: product.price,
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

// Inicializa o painel carregando os dados da nuvem
initAdminApp();
