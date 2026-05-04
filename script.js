
let transactions = [];
let budgets = {};
let goals = [];
let expenseChart = null;

function loadData() {
    const t = localStorage.getItem('pf_transactions');
    const b = localStorage.getItem('pf_budgets');
    const g = localStorage.getItem('pf_goals');
    transactions = t ? JSON.parse(t) : [];
    budgets = b ? JSON.parse(b) : {};
    goals = g ? JSON.parse(g) : [];
}

function saveData() {
    localStorage.setItem('pf_transactions', JSON.stringify(transactions));
    localStorage.setItem('pf_budgets', JSON.stringify(budgets));
    localStorage.setItem('pf_goals', JSON.stringify(goals));
}


function formatCurrency(value) {
    return value.toFixed(2);
}

function getMonthKey(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function getCurrentMonthKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}


function updateSummary() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('current-balance').textContent = formatCurrency(balance);

    updateGoalsProgress(balance);
}


function renderTransactions() {
    const tbody = document.querySelector('#transaction-table tbody');
    tbody.innerHTML = '';

    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const monthFilter = document.getElementById('filter-month').value;

    let filtered = [...transactions];

    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    if (monthFilter) {
        filtered = filtered.filter(t => getMonthKey(t.date) === monthFilter);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    for (const t of filtered) {
        const tr = document.createElement('tr');

        const dateTd = document.createElement('td');
        dateTd.textContent = t.date;

        const typeTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.classList.add('badge', t.type === 'income' ? 'badge-income' : 'badge-expense');
        badge.textContent = t.type === 'income' ? 'Income' : 'Expense';
        typeTd.appendChild(badge);

        const categoryTd = document.createElement('td');
        categoryTd.textContent = t.category;

        const amountTd = document.createElement('td');
        amountTd.textContent = formatCurrency(t.amount);

        const noteTd = document.createElement('td');
        noteTd.textContent = t.note || '';

        const actionTd = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.classList.add('btn-secondary', 'small');
        delBtn.addEventListener('click', () => deleteTransaction(t.id));
        actionTd.appendChild(delBtn);

        tr.appendChild(dateTd);
        tr.appendChild(typeTd);
        tr.appendChild(categoryTd);
        tr.appendChild(amountTd);
        tr.appendChild(noteTd);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    }
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateSummary();
    renderTransactions();
    renderBudgetTable();
    renderExpenseChart();
}


function renderBudgetTable() {
    const tbody = document.querySelector('#budget-table tbody');
    tbody.innerHTML = '';

    const currentMonth = getCurrentMonthKey();

    const categories = Object.keys(budgets);
    for (const cat of categories) {
        const tr = document.createElement('tr');
        const budgetValue = budgets[cat];

        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === cat && getMonthKey(t.date) === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0);

        const remaining = budgetValue - spent;

        let statusText = 'OK';
        let statusClass = 'badge-ok';
        if (remaining < 0) {
            statusText = 'Over budget';
            statusClass = 'badge-over';
        } else if (spent > budgetValue * 0.8) {
            statusText = 'Close to limit';
            statusClass = 'badge-warning';
        }

        const catTd = document.createElement('td');
        catTd.textContent = cat;

        const budgetTd = document.createElement('td');
        budgetTd.textContent = formatCurrency(budgetValue);

        const spentTd = document.createElement('td');
        spentTd.textContent = formatCurrency(spent);

        const remainingTd = document.createElement('td');
        remainingTd.textContent = formatCurrency(remaining);

        const statusTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.textContent = statusText;
        badge.classList.add('badge', statusClass);
        statusTd.appendChild(badge);

        tr.appendChild(catTd);
        tr.appendChild(budgetTd);
        tr.appendChild(spentTd);
        tr.appendChild(remainingTd);
        tr.appendChild(statusTd);

        tbody.appendChild(tr);
    }
}


function renderExpenseChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    const currentMonth = getCurrentMonthKey();

    const expenseByCategory = {};
    for (const t of transactions) {
        if (t.type === 'expense' && getMonthKey(t.date) === currentMonth) {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
    }

    const labels = Object.keys(expenseByCategory);
    const data = Object.values(expenseByCategory);

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (labels.length === 0) {
        expenseChart = null;
        ctx.clearRect(0, 0, 400, 200);
        return;
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                label: 'Expenses',
                data,
                backgroundColor: [
                    '#ef4444', '#f97316', '#facc15',
                    '#22c55e', '#3b82f6', '#a855f7', '#ec4899'
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}


function updateGoalsProgress(balance) {
    // Здесь можно использовать balance или только накопления;
    // для простоты считаем, что весь положительный баланс идёт на цели
    const available = Math.max(balance, 0);
    const perGoal = goals.length > 0 ? available / goals.length : 0;

    goals = goals.map(g => {
        const progress = Math.min((perGoal / g.target) * 100, 100);
        return { ...g, progress: isNaN(progress) ? 0 : progress };
    });

    renderGoals();
    saveData();
}

function renderGoals() {
    const ul = document.getElementById('goal-list');
    ul.innerHTML = '';

    for (const g of goals) {
        const li = document.createElement('li');
        li.classList.add('goal-item');

        const nameSpan = document.createElement('span');
        nameSpan.classList.add('goal-name');
        nameSpan.textContent = g.name;

        const metaSpan = document.createElement('span');
        metaSpan.classList.add('goal-meta');
        metaSpan.textContent = `Target: ${formatCurrency(g.target)} | Progress: ${g.progress.toFixed(1)}%`;

        li.appendChild(nameSpan);
        li.appendChild(metaSpan);
        ul.appendChild(li);
    }
}


function setupForms() {
    const transactionForm = document.getElementById('transaction-form');
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('type').value;
        const amount = parseFloat(document.getElementById('amount').value || '0');
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const note = document.getElementById('note').value.trim();

        if (!date || isNaN(amount) || amount <= 0) {
            return;
        }

        const newTransaction = {
            id: Date.now(),
            type,
            amount,
            category,
            date,
            note
        };
        transactions.push(newTransaction);
        saveData();

        transactionForm.reset();
        document.getElementById('type').value = 'income';

        updateSummary();
        renderTransactions();
        renderBudgetTable();
        renderExpenseChart();
    });

    const budgetForm = document.getElementById('budget-form');
    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value || '0');
        if (!category || isNaN(amount) || amount < 0) {
            return;
        }
        budgets[category] = amount;
        saveData();
        budgetForm.reset();
        renderBudgetTable();
    });

    const goalForm = document.getElementById('goal-form');
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('goal-name').value.trim();
        const target = parseFloat(document.getElementById('goal-target').value || '0');
        if (!name || isNaN(target) || target <= 0) {
            return;
        }
        const newGoal = {
            id: Date.now(),
            name,
            target,
            progress: 0
        };
        goals.push(newGoal);
        saveData();
        goalForm.reset();
        updateSummary(); 
    });
}


function setupFilters() {
    document.getElementById('filter-type').addEventListener('change', renderTransactions);
    document.getElementById('filter-category').addEventListener('change', renderTransactions);
    document.getElementById('filter-month').addEventListener('change', () => {
        renderTransactions();
        renderExpenseChart();
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-category').value = 'all';
        document.getElementById('filter-month').value = '';
        renderTransactions();
        renderExpenseChart();
    });

    document.getElementById('filter-month').value = getCurrentMonthKey();
}


document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupForms();
    setupFilters();
    updateSummary();
    renderTransactions();
    renderBudgetTable();
    renderExpenseChart();
    renderGoals();

    const dateInput = document.getElementById('date');
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${y}-${m}-${d}`;
});