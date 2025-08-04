let allProducts = []; // Store all products for filtering
let filteredProducts = []; // Store filtered products

$(document).ready(function () {
    const apiUrl = 'http://localhost:4000/api/v1/product';

    // Authentication helper functions
    const getAuthToken = () => {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    };

    const isUserLoggedIn = () => {
        const token = getAuthToken();
        if (!token) return false;
        
        try {
            // Basic token validation - check if it's not expired
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    };

    const redirectToLogin = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'Please log in to continue',
            showCancelButton: true,
            confirmButtonText: 'Go to Login',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Store current page for redirect after login
                localStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'loginregister.html'; // Adjust path as needed
            }
        });
    };

    // Add shared cart functions if they don't exist globally
    const getCart = () => {
        try {
            let cart = sessionStorage.getItem('cart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error parsing cart from sessionStorage:', error);
            return [];
        }
    }

    const saveCart = (cart) => {
        try {
            sessionStorage.setItem('cart', JSON.stringify(cart));
            console.log('Cart saved:', cart); // Debug log
        } catch (error) {
            console.error('Error saving cart to sessionStorage:', error);
        }
    }

    // DONE GET ALL PRODUCTS
    function renderProducts(products) {
        const $container = $('#products-container');
        $container.empty();

        products.forEach(product => {
            const card = `
                <div class="product-card">
                    <img class="product-image" src="${product.image || 'assets/no image.png'}" alt="${product.name}">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-price">₱${product.price}</div>
                    <div class="product-buttons">
                        <button class="prod-btn view-btn" data-id="${product.ID || product.id}">VIEW</button>
                        <button class="prod-btn reviews-btn" data-id="${product.ID || product.id}">REVIEWS</button>
                    </div>
                </div>
            `;
            $container.append(card);
        });
        
        console.log('Products rendered:', products.length);
    }

    // Load products on page load
    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            // Store all products globally for filtering
            allProducts = data.products || [];
            filteredProducts = [...allProducts]; // Initialize filtered products
            renderProducts(filteredProducts);
            console.log('Products loaded:', allProducts.length);
        },
        error: function (xhr, status, error) {
            console.error('Error loading products:', error);
            $('#products-container').html('<p>Failed to load products. Please try again later.</p>');
        }
    });

    // Product Details Modal Handler
    $(document).on('click', '.view-btn', function (e) {
        e.preventDefault();
        console.log('View Button clicked');
        
        const productId = $(this).data('id');
        console.log('Product ID:', productId);
        
        if (!productId) {
            console.error('No product ID found');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product ID not found'
            });
            return;
        }
        
        // Show loading state
        Swal.fire({
            title: 'Loading...',
            text: 'Fetching product details',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Fetch product details
        $.get(`${apiUrl}/${productId}`)
            .done(function(product) {
                console.log('Product data received:', product);
                
                // Store product data for use in cart/buy now functions
                window.currentProduct = product;
                
                // Populate product details
                $('#productName').text(product.Name || 'N/A');
                $('#productDescription').text(product.Description || 'No description available');
                $('#productPrice').text('₱' + parseFloat(product.Price || 0).toFixed(2));
                $('#productStocks').text(product.Stocks || 0);
                $('#productCategory').text(product.CategoryName || 'N/A');
                
                // Update button states based on stock
                const stockCount = parseInt(product.Stocks || 0);
                const $buyBtn = $('#buyNowBtn');
                const $cartBtn = $('#addToCartBtn');
                
                if (stockCount > 0) {
                    $buyBtn.prop('disabled', false).text('Buy Now');
                    $cartBtn.prop('disabled', false).text('Add to Cart');
                } else {
                    $buyBtn.prop('disabled', true).text('Out of Stock');
                    $cartBtn.prop('disabled', true).text('Out of Stock');
                }
                
                // Fetch product images
                $.get(`${apiUrl}/${productId}/images`)
                    .done(function(images) {
                        console.log('Product images received:', images);
                        
                        // Clear existing carousel items
                        const $carouselInner = $('#productCarousel .carousel-inner');
                        const $carouselIndicators = $('#productCarousel .carousel-indicators');
                        const $carouselControls = $('#productCarousel .carousel-control-prev, #productCarousel .carousel-control-next');
                        
                        $carouselInner.empty();
                        $carouselIndicators.empty();
                        
                        if (images && images.length > 0) {
                            // Create carousel items and indicators
                            images.forEach(function(image, index) {
                                const isActive = index === 0 ? 'active' : '';
                                
                                // Create carousel item
                                const carouselItem = `
                                    <div class="carousel-item ${isActive}">
                                        <img src="${image.Image}" class="d-block w-100" alt="${product.Name}" 
                                             style="height: 300px; object-fit: cover;" 
                                             onerror="this.src='assets/no image.png'">
                                    </div>
                                `;
                                $carouselInner.append(carouselItem);
                                
                                // Create indicator
                                const indicator = `
                                    <li data-target="#productCarousel" data-slide-to="${index}" class="${isActive}"></li>
                                `;
                                $carouselIndicators.append(indicator);
                            });
                            
                            // Show/hide carousel controls based on image count
                            if (images.length > 1) {
                                $carouselControls.show();
                                $carouselIndicators.show();
                            } else {
                                $carouselControls.hide();
                                $carouselIndicators.hide();
                            }
                        } else {
                            // No images available - show placeholder
                            const noImageItem = `
                                <div class="carousel-item active">
                                    <div class="d-flex align-items-center justify-content-center bg-light" style="height: 300px;">
                                        <div class="text-center text-muted">
                                            <i class="fas fa-image fa-3x mb-3"></i>
                                            <p>No images available</p>
                                        </div>
                                    </div>
                                </div>
                            `;
                            $carouselInner.append(noImageItem);
                            $carouselControls.hide();
                            $carouselIndicators.hide();
                        }
                        
                        // Close loading and show modal
                        Swal.close();
                        $('#productDetailsModal').modal('show');
                        
                        // Ensure modal is properly initialized
                        setTimeout(() => {
                            $('#productDetailsModal').modal('show');
                        }, 100);
                        
                    })
                    .fail(function(xhr, status, error) {
                        console.error('Error fetching product images:', error);
                        
                        // Still show modal even if images fail to load
                        const noImageItem = `
                            <div class="carousel-item active">
                                <div class="d-flex align-items-center justify-content-center bg-light" style="height: 300px;">
                                    <div class="text-center text-muted">
                                        <i class="fas fa-image fa-3x mb-3"></i>
                                        <p>Failed to load images</p>
                                    </div>
                                </div>
                            </div>
                        `;
                        $('#productCarousel .carousel-inner').html(noImageItem);
                        $('#productCarousel .carousel-control-prev, #productCarousel .carousel-control-next').hide();
                        $('#productCarousel .carousel-indicators').hide();
                        
                        Swal.close();
                        $('#productDetailsModal').modal('show');
                    });
            })
            .fail(function(xhr, status, error) {
                console.error('Error fetching product:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch product details. Please try again.'
                });
            });
    });

    // Reviews button handler
    $(document).on('click', '.reviews-btn', function () {
        const productId = $(this).data('id');
        $.get(`http://localhost:4000/api/v1/viewReview/product/${productId}`, function (reviews) {
            let reviewsHtml = '';
            if (!reviews.length) {
                reviewsHtml = '<div class="text-muted text-center">No reviews yet.</div>';
            } else {
                reviewsHtml = reviews.map(r => `
                    <div class="border rounded p-2 mb-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <span><strong>${r.user_name}</strong> <small class="text-muted">${new Date(r.ReviewDate).toLocaleString()}</small></span>
                            <span>${'★'.repeat(r.Rating)}${'☆'.repeat(5 - r.Rating)}</span>
                        </div>
                        <div class="mt-1">${r.Description}</div>
                    </div>
                `).join('');
            }
            const modalHtml = `
                <div class="modal fade" id="reviewsModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Product Reviews</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">${reviewsHtml}</div>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(modalHtml);
            $('#reviewsModal').modal('show');
            $('#reviewsModal').on('hidden.bs.modal', function () {
                $(this).remove();
            });
        });
    });

    // Add to Cart button handler with authentication
    $(document).on('click', '#addToCartBtn', function (e) {
        e.preventDefault();

        // Check authentication first
        if (!isUserLoggedIn()) {
            redirectToLogin();
            return;
        }

        if (!window.currentProduct) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product data not available'
            });
            return;
        }

        // Always use ProductID for cart logic
        const productId = window.currentProduct.ProductID || window.currentProduct.ID || window.currentProduct.id;
        const productName = window.currentProduct.Name || window.currentProduct.name;
        const qty = parseInt($('#cartQty').val()) || 1;
        const product = window.currentProduct;
        let cart = getCart();
        const availableStock = parseInt(product.Stocks) || 0;

        // Check stock availability
        if (qty > availableStock) {
            Swal.fire({
                icon: 'warning',
                title: 'Stock Limit',
                text: `Only ${availableStock} in stock.`
            });
            return;
        }

        // Only compare by ProductID
        let existingItemIndex = cart.findIndex(item => item.item_id === productId);

        if (existingItemIndex !== -1) {
            const existingItem = cart[existingItemIndex];
            const newQuantity = existingItem.quantity + qty;

            if (newQuantity > availableStock) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stock Limit',
                    text: `Only ${availableStock} in stock. You currently have ${existingItem.quantity} in your cart.`
                });
                return;
            }

            // Update quantity
            cart[existingItemIndex].quantity = newQuantity;
            console.log('Updated quantity:', cart[existingItemIndex]);
        } else {
            // Add new item
            const newItem = {
                item_id: productId,
                description: productName,
                price: parseFloat(product.Price) || 0,
                stock: availableStock,
                quantity: qty
            };

            cart.push(newItem);
            console.log('New item added:', newItem);
        }

        // Save updated cart to localStorage
        saveCart(cart);

        // Update UI cart count
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        $('#itemCount').text(totalItems).css('display', 'block');

        // Close modal and show success feedback
        $('#productDetailsModal').modal('hide');

        Swal.fire({
            icon: 'success',
            title: 'Added to Cart',
            text: `${productName} has been added to your cart.`,
            timer: 1200,
            showConfirmButton: false
        });

        console.log('Final cart state:', cart);
    });

    // Reset modal when closed
    $('#productDetailsModal').on('hidden.bs.modal', function () {
        $('#productCarousel').carousel(0); // Reset to first slide
        window.currentProduct = null; // Clear current product data
        
        // Reset button states
        $('#buyNowBtn').prop('disabled', false).text('Buy Now');
        $('#addToCartBtn').prop('disabled', false).text('Add to Cart');
    });

    // Ensure Bootstrap modal is properly initialized
    $(document).ready(function() {
        // Initialize modal if not already initialized
        if (typeof $.fn.modal !== 'undefined') {
            $('#productDetailsModal').modal({
                backdrop: 'static',
                keyboard: false,
                show: false
            });
        }
    });

    // Initialize header
    $(document).ready(function() {
        $('#header').load('./header.html');
    });

    // Filter functionality
function applyFilters() {
    const categoryFilter = $('#categoryFilter').val();
    const priceFilter = $('#priceFilter').val();
    const searchQuery = $('#searchProduct').val().toLowerCase();
    
    filteredProducts = allProducts.filter(product => {
        // Category filter
        const matchesCategory = categoryFilter === '' || 
            (product.category && product.category.toLowerCase() === categoryFilter.toLowerCase());
        
        // Price filter
        let matchesPrice = true;
        if (priceFilter !== '') {
            const price = parseFloat(product.price) || 0;
            switch (priceFilter) {
                case '0-100':
                    matchesPrice = price >= 0 && price <= 100;
                    break;
                case '101-500':
                    matchesPrice = price >= 101 && price <= 500;
                    break;
                case '501-1000':
                    matchesPrice = price >= 501 && price <= 1000;
                    break;
                case '1000+':
                    matchesPrice = price > 1000;
                    break;
            }
        }
        
        // Search filter
        const matchesSearch = searchQuery === '' || 
            (product.name && product.name.toLowerCase().includes(searchQuery)) ||
            (product.description && product.description.toLowerCase().includes(searchQuery));
        
        return matchesCategory && matchesPrice && matchesSearch;
    });
    
    renderProducts(filteredProducts);
    
    // Show results count
    const resultsText = filteredProducts.length === allProducts.length 
        ? `Showing all ${filteredProducts.length} products`
        : `Showing ${filteredProducts.length} of ${allProducts.length} products`;
    
    // Update or create results counter
    if ($('#resultsCounter').length === 0) {
        $('#products-container').before(`<div id="resultsCounter" class="text-muted mb-3 text-center"></div>`);
    }
    $('#resultsCounter').text(resultsText);
}

// Category filter change handler
$('#categoryFilter').on('change', applyFilters);

// Price filter change handler
$('#priceFilter').on('change', applyFilters);

// Search input handler with debounce for better performance
let searchTimeout;
$('#searchProduct').on('keyup', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300); // 300ms delay
});

// Clear filters handler
$('#clearFilters').on('click', function() {
    $('#categoryFilter').val('');
    $('#priceFilter').val('');
    $('#searchProduct').val('');
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
    $('#resultsCounter').text(`Showing all ${allProducts.length} products`);
});
});