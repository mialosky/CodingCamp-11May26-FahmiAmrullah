let transactions = [];
let customCategories = [];

const STORAGE_KEY = 'expense_tracker';
const CATS_KEY = 'custom_cats';

const itemName = document.getElementById('itemName');
const amount = document.getElementById('amount');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addTransactionBtn');
const transactionsListDiv = document.getElementById('transactionsList');
const totalBalanceSpan = document.getElementById('totalBalance');
const newCategoryInput = document.getElementById('newCategory');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const sortSelect = document.getElementById('sortSelect');
const darkToggle = document.getElementById('darkModeToggle');
const spendingBarsDiv = document.getElementById('spendingBars');

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  transactions = saved ? JSON.parse(saved) : [];
  
  const savedCats = localStorage.getItem(CATS_KEY);
  customCategories = savedCats ? JSON.parse(savedCats) : [];
  
  updateCategoryDropdown();
  updateUI();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(CATS_KEY, JSON.stringify(customCategories));
}

function updateCategoryDropdown() {
  const defaults = ['Food', 'Transport', 'Fun'];
  const all = [...defaults, ...customCategories];
  categorySelect.innerHTML = '';
  all.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function addCustomCategory() {
  const newCat = newCategoryInput.value.trim();
  if (!newCat) return alert('Masukkan nama kategori');
  if ([...['Food','Transport','Fun'], ...customCategories].includes(newCat)) {
    return alert('Kategori sudah ada');
  }
  customCategories.push(newCat);
  saveData();
  updateCategoryDropdown();
  newCategoryInput.value = '';
  updateUI();
}

function getSortedTransactions() {
  const type = sortSelect.value;
  const copy = [...transactions];
  if (type === 'amount_asc') copy.sort((a,b) => a.amount - b.amount);
  else if (type === 'amount_desc') copy.sort((a,b) => b.amount - a.amount);
  else if (type === 'category') copy.sort((a,b) => a.category.localeCompare(b.category));
  else copy.sort((a,b) => b.id - a.id);
  return copy;
}

function updateTotalBalance() {
  let total = 0;
  for (let t of transactions) total += t.amount;
  totalBalanceSpan.innerText = `$${total.toFixed(2)}`;
}

function getCategoryTotals() {
  const totals = {};
  for (let t of transactions) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }
  return totals;
}

function updateSpendingBars() {
  const totals = getCategoryTotals();
  const totalSpent = Object.values(totals).reduce((a,b) => a + b, 0);
  
  if (totalSpent === 0 || Object.keys(totals).length === 0) {
    spendingBarsDiv.innerHTML = '<p style="color:gray; text-align:center;">No spending yet</p>';
    return;
  }
  
  spendingBarsDiv.innerHTML = '';
  const sorted = Object.keys(totals).sort();
  
  for (let cat of sorted) {
    const amount = totals[cat];
    const percent = (amount / totalSpent) * 100;
    
    const barItem = document.createElement('div');
    barItem.className = 'category-bar-item';
    barItem.setAttribute('data-category', cat);
    
    barItem.innerHTML = `
      <div class="cat-label">${cat}</div>
      <div class="bar-wrapper">
        <div class="bar-fill-cat" style="width: ${percent}%">
          ${percent >= 15 ? `$${amount.toFixed(2)}` : ''}
        </div>
      </div>
      <div class="cat-percent">${percent.toFixed(1)}%</div>
    `;
    spendingBarsDiv.appendChild(barItem);
  }
}

function renderTransactions() {
  const sorted = getSortedTransactions();
  if (sorted.length === 0) {
    transactionsListDiv.innerHTML = '<p style="color:gray; text-align:center;">No transactions</p>';
    return;
  }
  
  transactionsListDiv.innerHTML = '';
  sorted.forEach(t => {
    const originalIdx = transactions.findIndex(orig => orig.id === t.id);
    const row = document.createElement('div');
    row.className = 'transaction-row';
    row.innerHTML = `
      <div class="transaction-details">
        <span class="transaction-name">${escapeHtml(t.name)}</span>
        <span class="transaction-cat">${t.category}</span>
      </div>
      <div class="transaction-amount">$${t.amount.toFixed(2)}</div>
      <button class="delete-transaction" data-idx="${originalIdx}">✕</button>
    `;
    transactionsListDiv.appendChild(row);
  });
  
  document.querySelectorAll('.delete-transaction').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-idx'));
      deleteTransaction(idx);
    });
  });
}

function deleteTransaction(index) {
  transactions.splice(index, 1);
  saveData();
  updateUI();
}

function addTransaction() {
  const name = itemName.value.trim();
  const amountVal = parseFloat(amount.value);
  const cat = categorySelect.value;
  
  if (!name) return alert('Isi Item Name');
  if (isNaN(amountVal) || amountVal <= 0) return alert('Amount harus > 0');
  
  transactions.push({
    id: Date.now(),
    name: name,
    amount: amountVal,
    category: cat
  });
  saveData();
  
  itemName.value = '';
  amount.value = '';
  updateUI();
}

function updateUI() {
  updateTotalBalance();
  renderTransactions();
  updateSpendingBars();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Dark Mode Fix
function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    document.body.classList.add('dark');
    darkToggle.textContent = '☀️ Light Mode';
  }
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    darkToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  });
}

addBtn.addEventListener('click', addTransaction);
addCategoryBtn.addEventListener('click', addCustomCategory);
sortSelect.addEventListener('change', () => renderTransactions());

loadData();
initDarkMode();