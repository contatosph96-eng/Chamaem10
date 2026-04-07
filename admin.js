// Verificação de segurança: checa se o administrador fez login
if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// Carrega o estoque salvo ou inicia com os produtos padrão
let inventory = JSON.parse(localStorage.getItem('chamaInventory')) || [
  { id: 1, name: 'iPhone 15 Pro', price: 7299.00, stock: 5, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692846360609' },
  { id: 2, name: 'AirPods Pro', price: 1899.00, stock: 12, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1694014871985' },
  { id: 3, name: 'Carregador Turbo 35W', price: 249.00, stock: 0, image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/HQ122?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1654031027103' }
];

// Função para salvar no localStorage
function saveInventory() {
  localStorage.setItem('chamaInventory', JSON.stringify(inventory));
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
    saveInventory();
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
    saveInventory();
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

    saveInventory();
    renderInventory();
    resetFormState();
  });
}

// Carregar os dados ao iniciar a página
renderInventory();

// Lógica para Renderizar Solicitações de Orçamento
const requestsTableBody = document.querySelector('#requests-table tbody');

function renderRequests() {
  if (!requestsTableBody) return;
  requestsTableBody.innerHTML = '';
  const requests = JSON.parse(localStorage.getItem('chamaRequests')) || [];

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
  let requests = JSON.parse(localStorage.getItem('chamaRequests')) || [];
  requests = requests.filter(req => req.id !== id);
  localStorage.setItem('chamaRequests', JSON.stringify(requests));
  renderRequests();
};

renderRequests();

// Lógica de Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('isAdminLoggedIn'); // Remove a sessão ativa
    window.location.href = 'index.html'; // Redireciona para a loja
  });
}
