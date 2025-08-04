document.addEventListener("DOMContentLoaded", async () => {
  // Verify login and admin access
  const token = sessionStorage.getItem('authToken');
  const userRole = sessionStorage.getItem('roleId');

  if (!token) {
    Swal.fire({
      title: 'Access Denied',
      text: 'Please login to access the admin dashboard',
      icon: 'error',
      confirmButtonText: 'Go to Login',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      window.location.href = '/login.html';
    });
    return;
  }
  
  if (userRole !== '1') {
    Swal.fire({
      title: 'Access Denied', 
      text: 'Administrator privileges required to access this page',
      icon: 'error',
      confirmButtonText: 'OK',
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then(() => {
      window.location.href = 'loginregister.html';
    });
    return;
  }
  console.log('Admin access verified, loading dashboard...');
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log('Loading enhanced dashboard data...');

    const loadingText = {
      revenue: "Revenue: Loading...",
      users: "Users: Loading...",
      products: "Products: Loading...",
      completed: "Completed Orders: Loading...",
      pending: "Pending Orders: Loading...",
      lowstock: "Low Stock Items: Loading..."
    };

    document.getElementById("total-revenue").textContent = loadingText.revenue;
    document.getElementById("total-users").textContent = loadingText.users;
    document.getElementById("total-products").textContent = loadingText.products;
    document.getElementById("completed-orders").textContent = loadingText.completed;
    document.getElementById("pending-orders").textContent = loadingText.pending;
    document.getElementById("low-stock").textContent = loadingText.lowstock;

    const res = await fetch("http://localhost:4000/api/v1/dashboard/overview", {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log('Enhanced dashboard data received:', data);

    // Safely parse numeric data
    const revenue = Number(data.totalRevenue) || 0;
    const users = Number(data.totalUsers) || 0;
    const products = Number(data.totalProducts) || 0;
    const completed = Number(data.completedOrders) || 0;
    const pending = Number(data.pendingOrders) || 0;
    const lowStock = Number(data.lowStockProducts) || 0;

    // Update summary cards
    document.getElementById("total-revenue").textContent = `Revenue: ₱${revenue.toFixed(2)}`;
    document.getElementById("total-users").textContent = `Users: ${users}`;
    document.getElementById("total-products").textContent = `Products: ${products}`;
    document.getElementById("completed-orders").textContent = `Completed Orders: ${completed}`;
    document.getElementById("pending-orders").textContent = `Pending Orders: ${pending}`;
    document.getElementById("low-stock").textContent = `Low Stock Items: ${lowStock}`;

    // Create charts
    createUsersChart(data);
    createProductsChart(data);
    createOrdersChart(data);
    createTopProductsChart(data);
    createStatusChart(data);
    createRevenueChart(data);
    updateRecentOrdersTable(data);

    // Load admin header
    const adminHeader = $('#adminheader');
    if (adminHeader.length > 0) {
      adminHeader.load('/adminheader.html', function (response, status, xhr) {
        if (status === "error") {
          console.warn('Could not load admin header:', xhr.status, xhr.statusText);
        }
      });
    }

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showErrorState();
  }
});

// Users by Address
function createUsersChart(data) {
  const canvas = document.getElementById("barChart");
  if (!canvas || !Array.isArray(data.usersByAddress)) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.usersByAddress.map(u => u.address || 'Unknown'),
      datasets: [{
        label: "Users",
        data: data.usersByAddress.map(u => Number(u.count) || 0),
        backgroundColor: "#4CAF50",
        borderColor: "#388e3c",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Users by Address' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// Products by Category
function createProductsChart(data) {
  const canvas = document.getElementById("pieChart");
  if (!canvas || !Array.isArray(data.productsByCategory)) return;

  new Chart(canvas, {
    type: "pie",
    data: {
      labels: data.productsByCategory.map(p => p.category || 'Unknown'),
      datasets: [{
        data: data.productsByCategory.map(p => Number(p.count) || 0),
        backgroundColor: ["#66bb6a", "#81c784", "#a5d6a7", "#c8e6c9", "#e8f5e8"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Products by Category' },
        legend: { position: 'bottom' }
      }
    }
  });
}

// Orders Over Time
function createOrdersChart(data) {
  const canvas = document.getElementById("lineChart");
  if (!canvas || !Array.isArray(data.ordersOverTime)) return;

  new Chart(canvas, {
    type: "line",
    data: {
      labels: data.ordersOverTime.map(o => new Date(o.date).toLocaleDateString()),
      datasets: [{
        label: "Completed Orders",
        data: data.ordersOverTime.map(o => Number(o.count) || 0),
        borderColor: "#388e3c",
        backgroundColor: "rgba(56, 142, 60, 0.1)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { title: { display: true, text: 'Completed Orders Over Time' } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// Top Selling Products
function createTopProductsChart(data) {
  const canvas = document.getElementById("topProductsChart");
  if (!canvas || !Array.isArray(data.topSellingProducts)) return;

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.topSellingProducts.map(p => p.product_name || 'Unknown'),
      datasets: [{
        label: "Units Sold",
        data: data.topSellingProducts.map(p => Number(p.total_sold) || 0),
        backgroundColor: "#FF9800",
        borderColor: "#F57C00",
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { title: { display: true, text: 'Top Selling Products' } },
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });
}

// Order Status Distribution
function createStatusChart(data) {
  const canvas = document.getElementById("statusChart");
  if (!canvas || !Array.isArray(data.orderStatusDistribution)) return;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: data.orderStatusDistribution.map(s => s.status || 'Unknown'),
      datasets: [{
        data: data.orderStatusDistribution.map(s => Number(s.count) || 0),
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Order Status Distribution' },
        legend: { position: 'bottom' }
      }
    }
  });
}

// Monthly Revenue
function createRevenueChart(data) {
  const canvas = document.getElementById("revenueChart");
  if (!canvas || !Array.isArray(data.monthlyRevenue)) return;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  new Chart(canvas, {
    type: "line",
    data: {
      labels: data.monthlyRevenue.map(r => `${monthNames[r.month - 1]} ${r.year}`),
      datasets: [{
        label: "Revenue (₱)",
        data: data.monthlyRevenue.map(r => Number(r.revenue) || 0),
        borderColor: "#9C27B0",
        backgroundColor: "rgba(156, 39, 176, 0.1)",
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Monthly Revenue Trend' }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '₱' + value.toFixed(2)
          }
        }
      }
    }
  });
}

// Recent Orders Table
function updateRecentOrdersTable(data) {
  const tableBody = document.querySelector("#recentOrdersTable tbody");
  if (!tableBody || !Array.isArray(data.recentOrders)) return;

  tableBody.innerHTML = '';

  data.recentOrders.forEach(order => {
    const row = document.createElement('tr');
    const statusClass = `status-${order.status || 'unknown'}`;
    const formattedDate = order.Date ? new Date(order.Date).toLocaleDateString() : 'N/A';
    const amount = order.total_amount ? `₱${Number(order.total_amount).toFixed(2)}` : '₱0.00';

    row.innerHTML = `
      <td>${order.Name || 'Unknown'}</td>
      <td>${formattedDate}</td>
      <td><span class="status-badge ${statusClass}">${order.status || 'Unknown'}</span></td>
      <td>${amount}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Error fallback
function showErrorState() {
  const cards = ['total-revenue', 'total-users', 'total-products', 'completed-orders', 'pending-orders', 'low-stock'];
  cards.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = el.textContent.split(':')[0] + ': Error loading data';
  });

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'background: #ffebee; color: #c62828; padding: 16px; margin: 16px; border-radius: 4px; border-left: 4px solid #c62828;';
  errorDiv.innerHTML = `
    <strong>Dashboard Error:</strong> Unable to load dashboard data. 
    <br><small>Check if the server is running on http://localhost:4000</small>
  `;
  document.body.insertBefore(errorDiv, document.querySelector('.summary-cards'));
}
