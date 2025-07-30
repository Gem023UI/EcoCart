$(document).ready(function() {
  // Check admin authentication
  const adminToken = sessionStorage.getItem('adminToken');
  if (!adminToken) {
    window.location.href = 'loginregister.html';
    return;
  }

  const url = 'http://localhost:4000';

  // Initialize variables
  let currentPage = 1;
  const ordersPerPage = 10;
  let allOrders = [];
  let filteredOrders = [];

  // Load orders
  function loadOrders() {
  $.ajax({
    url: `${url}/api/v1/renderOrders/`, // Use correct base URL
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
      success: function(orders) {
        allOrders = orders;
        applyFilters();
      },
      error: function(xhr) {
        if (xhr.status === 401) {
          window.location.href = 'loginregister.html';
        } else {
          showAlert('danger', 'Failed to load orders. Please try again.');
        }
      }
    });
  }

  // Apply filters and search
  function applyFilters() {
    const statusFilter = $('#filter-status').val();
    const searchQuery = $('#search-orders').val().toLowerCase();
    
    filteredOrders = allOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        order.id.toString().includes(searchQuery) ||
        (order.user && order.user.name.toLowerCase().includes(searchQuery)) ||
        order.status.toLowerCase().includes(searchQuery);
      return matchesStatus && matchesSearch;
    });
    
    renderOrdersTable();
    renderPagination();
  }

  // Render orders table
  function renderOrdersTable() {
    const tbody = $('#orders-table-body');
    tbody.empty();
    
    if (filteredOrders.length === 0) {
      tbody.append('<tr><td colspan="7" class="text-center py-4">No orders found.</td></tr>');
      return;
    }
    
    // Calculate pagination slice
    const startIdx = (currentPage - 1) * ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIdx, startIdx + ordersPerPage);
    
    paginatedOrders.forEach(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString();
      const customerName = order.user ? order.user.name : 'Guest';
      const itemCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
      
      const row = `
        <tr>
          <td>#${order.id}</td>
          <td>${customerName}</td>
          <td>${orderDate}</td>
          <td>${itemCount}</td>
          <td>₱${parseFloat(order.total).toFixed(2)}</td>
          <td>
            <span class="badge badge-${getBadgeClass(order.status)} status-badge" 
                  data-order-id="${order.id}" data-current-status="${order.status}">
              ${capitalizeFirstLetter(order.status)}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-info view-order" data-id="${order.id}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-order" data-id="${order.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
      tbody.append(row);
    });
    
    // Attach event listeners
    $('.status-badge').click(handleStatusChange);
    $('.view-order').click(viewOrderDetails);
    $('.delete-order').click(deleteOrder);
  }

  // Render pagination
  function renderPagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const pagination = $('#pagination');
    pagination.empty();
    
    if (totalPages <= 1) return;
    
    // Previous button
    pagination.append(`
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `);
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      pagination.append(`
        <li class="page-item">
          <a class="page-link" href="#" data-page="1">1</a>
        </li>
        ${startPage > 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
      `);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pagination.append(`
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `);
    }
    
    if (endPage < totalPages) {
      pagination.append(`
        ${endPage < totalPages - 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        <li class="page-item">
          <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
        </li>
      `);
    }
    
    // Next button
    pagination.append(`
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `);
    
    // Attach click handlers
    $('.page-link').click(function(e) {
      e.preventDefault();
      const page = $(this).data('page');
      if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderOrdersTable();
        $('html, body').animate({ scrollTop: 0 }, 'fast');
      }
    });
  }

  // Handle status change
  function handleStatusChange() {
    const orderId = $(this).data('order-id');
    const currentStatus = $(this).data('current-status');
    
    const statusOptions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    
    const availableOptions = statusOptions[currentStatus];
    
    if (availableOptions.length === 0) {
      showAlert('info', 'This order cannot be updated further.');
      return;
    }
    
    const statusModal = `
      <div class="modal fade" id="statusModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Update Order Status</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Update status for Order #${orderId}:</p>
              <select id="status-select" class="form-control">
                ${availableOptions.map(option => `
                  <option value="${option}">${capitalizeFirstLetter(option)}</option>
                `).join('')}
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirm-status">Update</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    $('body').append(statusModal);
    $('#statusModal').modal('show');
    
    $('#confirm-status').click(function() {
      const newStatus = $('#status-select').val();
      updateOrderStatus(orderId, newStatus);
      $('#statusModal').modal('hide');
    });
    
    $('#statusModal').on('hidden.bs.modal', function() {
      $(this).remove();
    });
  }

  // Update order status
  function updateOrderStatus(orderId, newStatus) {
  $.ajax({
    url: `${url}/api/v1/updateOrderID/${orderId}/status`, // FIXED
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
      data: JSON.stringify({ status: newStatus }),
      success: function() {
        showAlert('success', 'Order status updated successfully!');
        loadOrders();
      },
      error: function() {
        showAlert('danger', 'Failed to update order status. Please try again.');
      }
    });
  }

  // View order details
  function viewOrderDetails() {
  const orderId = $(this).data('id');
  $.ajax({
    url: `${url}/api/v1/renderOrderID/${orderId}`, // FIXED
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
      success: function(order) {
        renderOrderDetails(order);
        $('#orderDetailsModal').modal('show');
      },
      error: function() {
        showAlert('danger', 'Failed to load order details. Please try again.');
      }
    });
  }

  // Render order details
  function renderOrderDetails(order) {
    const orderDate = new Date(order.created_at).toLocaleString();
    const customerName = order.User ? order.User.name : 'Guest';
    const customerEmail = order.User ? order.User.email : 'N/A';
    
    let productsHtml = '';
    if (order.Products && order.Products.length > 0) {
      productsHtml = order.Products.map(product => `
        <div class="row mb-3 border-bottom pb-2">
          <div class="col-md-2">
            <img src="${product.image || 'https://via.placeholder.com/100'}" 
                 alt="${product.name}" 
                 class="img-thumbnail">
          </div>
          <div class="col-md-6">
            <h5>${product.name}</h5>
            <p class="text-muted">SKU: ${product.id}</p>
            <p>₱${parseFloat(product.price).toFixed(2)} x ${product.OrderItem.quantity}</p>
          </div>
          <div class="col-md-4 text-right">
            <p class="font-weight-bold">₱${parseFloat(product.price * product.OrderItem.quantity).toFixed(2)}</p>
          </div>
        </div>
      `).join('');
    }
    
    const detailsHtml = `
      <div class="container-fluid">
        <div class="row mb-4">
          <div class="col-md-6">
            <h4>Order #${order.id}</h4>
            <p><strong>Date:</strong> ${orderDate}</p>
            <p><strong>Status:</strong> 
              <span class="badge badge-${getBadgeClass(order.status)}">
                ${capitalizeFirstLetter(order.status)}
              </span>
            </p>
          </div>
          <div class="col-md-6">
            <h4>Customer Details</h4>
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
          </div>
        </div>
        
        <h4 class="mb-3">Order Items</h4>
        ${productsHtml}
        
        <div class="row mt-4">
          <div class="col-md-6">
            <h4>Shipping Information</h4>
            <p><strong>Address:</strong></p>
            <p class="text-muted">${order.shipping_address || 'N/A'}</p>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h4 class="card-title">Order Summary</h4>
                <div class="d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>₱${parseFloat(order.subtotal || order.total).toFixed(2)}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Shipping Fee:</span>
                  <span>₱${parseFloat(order.shipping_fee || 0).toFixed(2)}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between font-weight-bold">
                  <span>Total:</span>
                  <span>₱${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    $('#order-details-content').html(detailsHtml);
  }

  // Delete order
  function deleteOrder() {
    const orderId = $(this).data('id');
    
    const confirmModal = `
      <div class="modal fade" id="confirmDeleteModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">Confirm Deletion</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete Order #${orderId}? This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirm-delete">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    $('body').append(confirmModal);
    $('#confirmDeleteModal').modal('show');
    
    $('#confirm-delete').click(function() {
      performDeleteOrder(orderId);
      $('#confirmDeleteModal').modal('hide');
    });
    
    $('#confirmDeleteModal').on('hidden.bs.modal', function() {
      $(this).remove();
    });
  }

  // Perform order deletion
  function performDeleteOrder(orderId) {
  $.ajax({
    url: `${url}/api/v1/deleteOrderID/${orderId}`, // FIXED
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
      success: function() {
        showAlert('success', 'Order deleted successfully!');
        loadOrders();
      },
      error: function() {
        showAlert('danger', 'Failed to delete order. Please try again.');
      }
    });
  }

  // Helper functions
  function getBadgeClass(status) {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  function capitalizeFirstLetter(string) {
  if (!string || typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function showAlert(type, message) {
    const alert = `
      <div class="alert alert-${type} alert-dismissible fade show fixed-top mx-auto mt-3" style="max-width: 500px;">
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `;
    $('body').append(alert);
    setTimeout(() => $('.alert').alert('close'), 5000);
  }

  // Event listeners
  $('#filter-status').change(applyFilters);
  $('#search-orders').on('input', function() {
    currentPage = 1;
    applyFilters();
  });

  $(document).ready(function() {
      $('#adminheader').load('./adminheader.html');
  });

  // Initial load
  loadOrders();
});