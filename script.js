const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const yearSelect = document.getElementById("yearSelect");

let chart;
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

function generateID() {
  return Date.now();
}

function addTransaction(e) {
  e.preventDefault();

  const type = document.getElementById("type").value;
  const enteredAmount = Math.abs(+amount.value);
  const date = new Date();

  const transaction = {
    id: generateID(),
    amount: type === "expense" ? -enteredAmount : enteredAmount,
    category: category.value,
    date: date.toISOString()
  };

  transactions.push(transaction);
  updateLocalStorage();
  addTransactionDOM(transaction);
  updateValues();
  drawChart();

  amount.value = "";
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? "-" : "+";
  const item = document.createElement("li");
  item.classList.add(transaction.amount < 0 ? "minus" : "plus");

  item.innerHTML = `
    (${transaction.category}) 
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

  balance.innerText = `$${total}`;
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
  let csv = "Date,Type,Amount,Category,Description\n";
  transactions.forEach(t => {
    const d = new Date(t.id).toLocaleDateString();
    const type = t.amount >= 0 ? "Income" : "Expense";
    const desc = t.text || "";
    csv += `${d},${type},${t.amount},${t.category},${desc}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
}


function populateYearSelect() {
  const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
  yearSelect.innerHTML = "";
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });
  if (years.length > 0) {
    yearSelect.value = years[0];
  }
}

function drawChart() {
  const ctx = document.getElementById("expenseChart").getContext("2d");

  const selectedYear = parseInt(yearSelect.value);
  const monthlyData = {};

  transactions.forEach(t => {
    const d = new Date(t.date);
    const year = d.getFullYear();
    if (year === selectedYear) {
      const key = d.getMonth(); // 0–11
      if (!monthlyData[key]) monthlyData[key] = { income: 0, expense: 0 };
      if (t.amount >= 0) monthlyData[key].income += t.amount;
      else monthlyData[key].expense += Math.abs(t.amount);
    }
  });

  const labels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const income = labels.map((_, i) => (monthlyData[i]?.income || 0));
  const expense = labels.map((_, i) => (monthlyData[i]?.expense || 0));

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: "Income",
          data: income,
          backgroundColor: "#708238" // Olive Green
        },
        {
          label: "Expense",
          data: expense,
          backgroundColor: "#000000" // Black
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Monthly Overview - ${selectedYear}`
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function init() {
  list.innerHTML = "";
  transactions.forEach(addTransactionDOM);
  updateValues();
  populateYearSelect();
  drawChart();
}

form.addEventListener("submit", addTransaction);
yearSelect.addEventListener("change", drawChart);

init();



  
 
