document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("http://localhost:4000/api/v1/dashboard/overview");
  const data = await res.json();

  // Update counts
  document.getElementById("total-users").textContent = `Users: ${data.totalUsers}`;
  document.getElementById("total-products").textContent = `Products: ${data.totalProducts}`;
  document.getElementById("completed-orders").textContent = `Completed Orders: ${data.completedOrders}`;

  // Bar Chart – Users per Address
  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: data.usersByAddress.map(u => u.address),
      datasets: [{
        label: "Users",
        data: data.usersByAddress.map(u => u.count),
        backgroundColor: "#4CAF50"
      }]
    },
    options: { responsive: true }
  });

  // Pie Chart – Products per Category
  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: data.productsByCategory.map(p => p.category),
      datasets: [{
        data: data.productsByCategory.map(p => p.count),
        backgroundColor: ["#66bb6a", "#81c784", "#a5d6a7"]
      }]
    },
    options: { responsive: true }
  });

  // Line Chart – Completed Orders Over Time
  new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: data.ordersOverTime.map(o => o.date),
      datasets: [{
        label: "Completed Orders",
        data: data.ordersOverTime.map(o => o.count),
        borderColor: "#388e3c",
        fill: false
      }]
    },
    options: { responsive: true }
  });
});
