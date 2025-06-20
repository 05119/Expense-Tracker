const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
let chart;

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

function generateID() {
  return Date.now();
}

function addTransaction(e) {
  e.preventDefault();

  const type = document.getElementById("type").value;
  const enteredAmount = Math.abs(+amount.value); // always positive input

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: type === "expense" ? -enteredAmount : enteredAmount,
    category: category.value
  };

  transactions.push(transaction);
  updateLocalStorage();
  addTransactionDOM(transaction);
  updateValues();
  drawChart();

  // Clear inputs
  text.value = "";
  amount.value = "";
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? "-" : "+";
  const item = document.createElement("li");
  item.classList.add(transaction.amount < 0 ? "minus" : "plus");

  item.innerHTML = `
    ${transaction.text} (${transaction.category}) 
    <span>${sign}$${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;
  list.appendChild(item);
}

function updateValues() {
  const amounts = transactions.map(t => t.amount);
  const total = amounts.reduce((acc, val) => acc + val, 0).toFixed(2);
  const income = amounts.filter(val => val > 0).reduce((a, b) => a + b, 0).toFixed(2);
  const expense = amounts.filter(val => val < 0).reduce((a, b) => a + b, 0).toFixed(2);

  balance.innerText = total;
  money_plus.innerText = `+$${income}`;
  money_minus.innerText = `-$${Math.abs(expense)}`;
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  init();
}

function updateLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function exportCSV() {
  let csv = "Text,Amount,Category\n";
  transactions.forEach(t => {
    csv += `${t.text},${t.amount},${t.category}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
}

function drawChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");
  const monthlyData = {};

  transactions.forEach(t => {
    const d = new Date(t.id);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
    if (t.amount >= 0) monthlyData[key].income += t.amount;
    else monthlyData[key].expense += Math.abs(t.amount);
  });

  const labels = Object.keys(monthlyData);
  const incomes = labels.map(l => monthlyData[l].income);
  const expenses = labels.map(l => monthlyData[l].expense);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: "Income", data: incomes, backgroundColor: "green" },
        { label: "Expense", data: expenses, backgroundColor: "red" }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function init() {
  list.innerHTML = "";
  transactions.forEach(addTransactionDOM);
  updateValues();
  drawChart();
}

init();
form.addEventListener("submit", addTransaction);
