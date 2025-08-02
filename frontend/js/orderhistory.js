$(document).ready(function () {
  const userId = sessionStorage.getItem("userId");
  if (!userId) {
    window.location.href = "loginregister.html";
    return;
  }

  $.get(`http://localhost:4000/api/v1/viewOrderHistory/${userId}`)
    .done(function (orders) {
      const container = $("#order-history-cards");
      container.empty();

    if (!orders.length) {
      container.append('<div class="col-12 text-center text-muted">No orders yet.</div>');
      return;
    }

    orders.forEach(order => {
      // Debug: Log the order object to see what data is available
      console.log('Order data:', order);
      
      const card = $(`
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card shadow-sm h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title mb-2">Order #${order.id}</h5>
              <p class="mb-1"><strong>Date:</strong> ${order.Date ? new Date(order.Date).toLocaleDateString() : 'N/A'}</p>
              <p class="mb-1"><strong>Product:</strong> ${order.product_name}</p>
              <p class="mb-1"><strong>Quantity:</strong> ${order.quantity}</p>
              <p class="mb-1"><strong>Total:</strong> ₱${parseFloat(order.total).toFixed(2)}</p>
              <p class="mb-1"><strong>Status:</strong> <span class="badge badge-${getBadge(order.status)}">${order.status}</span></p>
              <div class="mt-auto text-right">
                ${order.status === 'delivered' ? `<button class="btn btn-success btn-sm review-btn" data-order-id="${order.id}" data-product-id="${order.product_id}">Review</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `);
      container.append(card);
    });
  })
  .fail(function(xhr, status, error) {
    console.error('Error fetching order history:', error);
    const container = $("#order-history-cards");
    container.append('<div class="col-12 text-center text-danger">Error loading order history. Please try again.</div>');
  });
  

  // Helper for badge color
  function getBadge(status) {
    switch (status) {
      case 'pending': return 'warning';
      case 'ship': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      default: return 'secondary';
    }
  }

  // Review button click handler (event delegation)
  $(document).on('click', '.review-btn', function () {
    const orderId = $(this).data('order-id');
    const productId = $(this).data('product-id');
    
    // Debug: Check if values are being retrieved correctly
    console.log('Review button clicked - Order ID:', orderId, 'Product ID:', productId);
    
    // Validate that both IDs are present and not undefined
    if (!orderId || !productId || orderId === 'undefined' || productId === 'undefined') {
      alert('Error: Missing order or product information. Please refresh the page and try again.');
      return;
    }
    
    showReviewModal(orderId, productId);
  });

  // Show review modal
  function showReviewModal(orderId, productId) {
    // Remove any existing modal to prevent duplicates
    $('#reviewModal').remove();

    const modalHtml = `
      <div class="modal fade" id="reviewModal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <form id="reviewForm" class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Leave a Review</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="reviewDescription">Description</label>
                <textarea class="form-control" id="reviewDescription" name="description" rows="3" required></textarea>
              </div>
              <div class="form-group">
                <label>Rating</label>
                <div id="starRating" class="mb-2">
                  ${[1, 2, 3, 4, 5].map(i => `
                    <i class="fa fa-star-o star" data-value="${i}" style="font-size: 1.5rem; cursor:pointer;"></i>
                  `).join('')}
                </div>
                <input type="hidden" name="rating" id="reviewRating" value="0" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-success">Submit Review</button>
            </div>
          </form>
        </div>
      </div>
    `;
    $('body').append(modalHtml);
    $('#reviewModal').modal('show');

    // Track selected rating
    let selectedRating = 0;

    // Star hover effect
    $('#starRating').on('mouseenter', '.star', function () {
      const val = $(this).data('value');
      highlightStars(val);
    });

    $('#starRating').on('mouseleave', function () {
      highlightStars(selectedRating);
    });

    // Star click to select rating
    $('#starRating').on('click', '.star', function () {
      selectedRating = $(this).data('value');
      $('#reviewRating').val(selectedRating);
      highlightStars(selectedRating);
    });

    function highlightStars(rating) {
      $('#starRating .star').each(function () {
        const val = $(this).data('value');
        $(this)
          .removeClass('fa-star fa-star-o')
          .addClass(val <= rating ? 'fa-star' : 'fa-star-o');
      });
    }

    // Submit review
    $('#reviewForm').on('submit', function (e) {
      e.preventDefault();
      const description = $('#reviewDescription').val().trim();
      const rating = parseInt($('#reviewRating').val());

      if (!rating || rating < 1 || rating > 5) {
        alert('Please select a rating.');
        return;
      }

      // Validate data before sending
      if (!orderId || !productId || orderId === 'undefined' || productId === 'undefined') {
        alert('Error: Missing order or product information. Please refresh the page and try again.');
        return;
      }

      console.log('Submitting review:', {
        orderId: orderId,
        productId: productId,
        userId: sessionStorage.getItem("userId"),
        description: description,
        rating: rating
      });

      $.ajax({
        url: 'http://localhost:4000/api/v1/createReview',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          orderId: parseInt(orderId),  // Ensure it's a number
          productId: parseInt(productId),  // Ensure it's a number
          userId: parseInt(sessionStorage.getItem("userId")),  // Ensure it's a number
          description,
          rating
        }),
        success: function (response) {
          $('#reviewModal').modal('hide');
          $('#reviewModal').remove();
          alert('Review submitted successfully!');
          // Optionally reload the page or update the UI
          location.reload();
        },
        error: function (xhr, status, error) {
          console.error('Error submitting review:', xhr.responseText);
          alert('Failed to submit review. Please try again.');
        }
      });
    });

    $('#reviewModal').on('hidden.bs.modal', function () {
      $(this).remove();
    });
  }

  $(document).ready(function() {
    $('#header').load('./header.html');
  });
});