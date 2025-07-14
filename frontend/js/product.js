$(document).ready(function () {
    const apiUrl = 'http://localhost:4000/api/v1/product';

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
                        <button class="prod-btn view-btn" data-id="${product.id}">VIEW</button>
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
            renderProducts(data.products);
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

    // Add to Cart button handler
    $(document).on('click', '#addToCartBtn', function(e) {
        e.preventDefault();
        
        if (!window.currentProduct) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product data not available'
            });
            return;
        }
        
        // Check stock availability
        const stockCount = parseInt(window.currentProduct.Stocks || 0);
        if (stockCount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Out of Stock',
                text: 'This product is currently out of stock'
            });
            return;
        }
        
        // Add to cart logic here
        // You can implement this based on your cart system
        console.log('Adding to cart:', window.currentProduct);
        
        Swal.fire({
            icon: 'success',
            title: 'Added to Cart!',
            text: `${window.currentProduct.Name} has been added to your cart.`,
            showConfirmButton: false,
            timer: 1500
        });
        
        // Close modal after adding to cart
        $('#productDetailsModal').modal('hide');
    });

    // Buy Now button handler
    $(document).on('click', '#buyNowBtn', function(e) {
        e.preventDefault();
        
        if (!window.currentProduct) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Product data not available'
            });
            return;
        }
        
        // Check stock availability
        const stockCount = parseInt(window.currentProduct.Stocks || 0);
        if (stockCount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Out of Stock',
                text: 'This product is currently out of stock'
            });
            return;
        }
        
        // Buy now logic here
        // You can redirect to checkout page or implement immediate purchase
        console.log('Buy now clicked for:', window.currentProduct);
        
        Swal.fire({
            icon: 'info',
            title: 'Proceeding to Checkout',
            text: 'Redirecting to checkout page...',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            // Redirect to checkout page or implement your buy now logic
            // window.location.href = '/checkout.html';
            console.log('Redirect to checkout page');
        });
        
        // Close modal
        $('#productDetailsModal').modal('hide');
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
});