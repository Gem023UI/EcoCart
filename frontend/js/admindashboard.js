const apiUrl = 'http://localhost:4000/api/v1';
let currentProductId = null;
let categories = [];

const getToken = () => {
    const userId = sessionStorage.getItem('userId');

    if (!userId) {
        Swal.fire({
            icon: 'warning',
            text: 'You must be logged in to access this page.',
            showConfirmButton: true
        }).then(() => {
            window.location.href = 'loginregister.html';
        });
        return false;
    }
    return true;
}

// Load categories for dropdown
function loadCategories() {
    $.get(`${apiUrl}/categories`)
        .done(function(data) {
            categories = data;
            const categorySelect = $('#editProductCategory');
            categorySelect.empty();
            categorySelect.append('<option value="">Select Category</option>');
            
            categories.forEach(category => {
                categorySelect.append(`<option value="${category.ProdCategoryID}">${category.Category}</option>`);
            });
        })
        .fail(function(error) {
            console.error('Error loading categories:', error);
        });
}

// Load products with images
function loadProducts() {
    if (!getToken()) {
        return;
    }

    console.log('Loading products...');
    
    $.get(`${apiUrl}/productTable`)
        .done(function(data) {
            console.log('Products loaded:', data);
            
            const $container = $('#products-container');
            $container.empty();
            
            if (!data.products || data.products.length === 0) {
                $container.append('<div class="col-12 text-center"><p>No products found</p></div>');
                return;
            }
            
            data.products.forEach(product => {
                const productCard = createProductCard(product);
                $container.append(productCard);
            });
        })
        .fail(function(xhr, status, error) {
            console.error('Error loading products:', error);
            $('#products-container').html('<div class="col-12 text-center text-danger"><p>Failed to load products. Please try again later.</p></div>');
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load products. Please check your connection and try again.'
            });
        });
}

// Create product card with carousel
function createProductCard(product) {
    const images = product.images && product.images.length > 0 ? product.images : ['assets/no image.png'];
    const carouselId = `carousel-${product.id}`;
    
    // Create carousel indicators
    let indicators = '';
    images.forEach((image, index) => {
        indicators += `<li data-target="#${carouselId}" data-slide-to="${index}" class="${index === 0 ? 'active' : ''}"></li>`;
    });
    
    // Create carousel items
    let carouselItems = '';
    images.forEach((image, index) => {
        const imageSrc = image === 'assets/no image.png' ? image : `http://localhost:4000/uploads/products/${image}`;
        carouselItems += `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img class="d-block w-100 product-image" src="${imageSrc}" alt="${product.name}" 
                     onerror="this.src='assets/no image.png'" style="height: 200px; object-fit: cover;">
            </div>
        `;
    });
    
    return `
        <div class="product-card">
            <div id="${carouselId}" class="carousel slide" data-ride="carousel">
                ${images.length > 1 ? `<ol class="carousel-indicators">${indicators}</ol>` : ''}
                <div class="carousel-inner">
                    ${carouselItems}
                </div>
                ${images.length > 1 ? `
                    <a class="carousel-control-prev" href="#${carouselId}" role="button" data-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#${carouselId}" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>
                ` : ''}
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-description">${product.description}</div>
                <div class="product-price">₱${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-stock">Stock: ${product.stocks}</div>
                <div class="product-buttons">
                    <button class="btn btn-primary btn-sm edit-product-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-product-btn" data-id="${product.id}" data-name="${product.name}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Edit product button click handler
$(document).on('click', '.edit-product-btn', function() {
    const productId = $(this).data('id');
    currentProductId = productId;
    
    console.log('Edit button clicked for product ID:', productId);
    
    // Show loading
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
    $.get(`${apiUrl}/productEdit/${productId}`)
        .done(function(product) {
            console.log('Product data received:', product);
            
            // Populate form fields
            $('#editProductId').val(product.ProductID);
            $('#editProductName').val(product.Name);
            $('#editProductCategory').val(product.ProdCategoryID);
            $('#editProductDescription').val(product.Description);
            $('#editProductPrice').val(product.Price);
            $('#editProductStock').val(product.Stocks);
            
            // Load current images
            loadCurrentImages(productId);
            
            // Clear new image selection
            $('#editProductImages').val('');
            $('#imagePreview').hide();
            
            Swal.close();
            $('#editProductModal').modal('show');
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

// Load current images for editing
function loadCurrentImages(productId) {
    $.get(`${apiUrl}/productImages/${productId}`)
        .done(function(images) {
            console.log('Current images loaded:', images);
            
            const currentImagesContainer = $('#currentImages');
            currentImagesContainer.empty();
            
            if (images && images.length > 0) {
                images.forEach(image => {
                    const imageCard = `
                        <div class="col-md-3 mb-2">
                            <div class="card">
                                <img src="http://localhost:4000/uploads/products/${image.Image}" 
                                     class="card-img-top" style="height: 100px; object-fit: cover;" 
                                     alt="Product Image" onerror="this.src='assets/no image.png'">
                                <div class="card-body p-2">
                                    <button type="button" class="btn btn-danger btn-sm btn-block delete-image-btn" 
                                            data-image-id="${image.ProductImageID}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    currentImagesContainer.append(imageCard);
                });
            } else {
                currentImagesContainer.append('<div class="col-12"><p class="text-muted">No images available</p></div>');
            }
        })
        .fail(function(error) {
            console.error('Error loading current images:', error);
            $('#currentImages').html('<div class="col-12"><p class="text-danger">Failed to load current images</p></div>');
        });
}

// Delete individual image
$(document).on('click', '.delete-image-btn', function() {
    const imageId = $(this).data('image-id');
    const imageCard = $(this).closest('.col-md-3');
    
    Swal.fire({
        title: 'Delete Image?',
        text: 'Are you sure you want to delete this image?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${apiUrl}/productImage/${imageId}`,
                method: 'DELETE',
                success: function() {
                    imageCard.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Image has been deleted.',
                        timer: 1500
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Error deleting image:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete image. Please try again.'
                    });
                }
            });
        }
    });
});

// Edit product form submission
$('#editProductForm').on('submit', function(e) {
    e.preventDefault();
    
    const productId = $('#editProductId').val();
    const formData = {
        name: $('#editProductName').val(),
        description: $('#editProductDescription').val(),
        price: $('#editProductPrice').val(),
        stocks: $('#editProductStock').val(),
        categoryId: $('#editProductCategory').val()
    };
    
    console.log('Updating product with data:', formData);
    
    // Show loading
    Swal.fire({
        title: 'Updating...',
        text: 'Please wait while we update the product',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Update product details
    $.ajax({
        url: `${apiUrl}/productUpdate/${productId}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(formData),
        success: function(response) {
            console.log('Product updated successfully:', response);
            
            // Check if there are new images to upload
            const newImages = $('#editProductImages')[0].files;
            if (newImages.length > 0) {
                uploadNewImages(productId);
            } else {
                // No new images, just close modal and reload
                $('#editProductModal').modal('hide');
                loadProducts();
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Product updated successfully!',
                    timer: 1500
                });
            }
        },
        error: function(xhr, status, error) {
            console.error('Error updating product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update product. Please try again.'
            });
        }
    });
});

// Upload new images
function uploadNewImages(productId) {
    const formData = new FormData();
    const files = $('#editProductImages')[0].files;
    
    for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
    }
    
    console.log('Uploading new images for product:', productId);
    
    $.ajax({
        url: `${apiUrl}/productImages/${productId}`,
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            console.log('Images uploaded successfully:', response);
            $('#editProductModal').modal('hide');
            loadProducts();
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Product and images updated successfully!',
                timer: 1500
            });
        },
        error: function(xhr, status, error) {
            console.error('Error uploading images:', error);
            Swal.fire({
                icon: 'error',
                title: 'Warning',
                text: 'Product updated but failed to upload some images. Please try uploading them again.'
            });
            $('#editProductModal').modal('hide');
            loadProducts();
        }
    });
}

// Delete product button click handler
$(document).on('click', '.delete-product-btn', function() {
    const productId = $(this).data('id');
    const productName = $(this).data('name');
    
    console.log('Delete button clicked for product:', productId, productName);
    
    currentProductId = productId;
    $('#deleteProductName').text(productName);
    $('#deleteProductModal').modal('show');
});

// Confirm delete button click
$('#confirmDeleteBtn').on('click', function() {
    if (!currentProductId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No product selected for deletion.'
        });
        return;
    }
    
    console.log('Confirming delete for product ID:', currentProductId);
    
    // Show loading
    Swal.fire({
        title: 'Deleting...',
        text: 'Please wait while we delete the product',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    $.ajax({
        url: `${apiUrl}/productDelete/${currentProductId}`,
        method: 'DELETE',
        success: function(response) {
            console.log('Product deleted successfully:', response);
            $('#deleteProductModal').modal('hide');
            loadProducts();
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Product has been deleted successfully.',
                timer: 1500
            });
            currentProductId = null;
        },
        error: function(xhr, status, error) {
            console.error('Error deleting product:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete product. Please try again.'
            });
        }
    });
});

// Initialize the page
$(document).ready(function() {
    console.log('Product management page loaded');
    
    // Load categories first, then products
    loadCategories();
    loadProducts();
    
    // Reset form when modal is closed
    $('#editProductModal').on('hidden.bs.modal', function() {
        $('#editProductForm')[0].reset();
        $('#currentImages').empty();
        $('#imagePreview').hide();
        currentProductId = null;
    });
    
    $('#deleteProductModal').on('hidden.bs.modal', function() {
        currentProductId = null;
    });
});

// Additional CSS for better product card styling
const additionalStyles = `
<style>
.product-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    overflow: hidden;
    transition: transform 0.3s ease;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-info {
    padding: 15px;
}

.product-name {
    font-size: 1.2em;
    font-weight: bold;
    margin-bottom: 5px;
    color: #2c3e50;
}

.product-category {
    color: #7f8c8d;
    font-size: 0.9em;
    margin-bottom: 8px;
}

.product-description {
    color: #34495e;
    font-size: 0.9em;
    margin-bottom: 10px;
    line-height: 1.4;
}

.product-price {
    font-size: 1.3em;
    font-weight: bold;
    color: #27ae60;
    margin-bottom: 5px;
}

.product-stock {
    color: #7f8c8d;
    font-size: 0.9em;
    margin-bottom: 15px;
}

.product-buttons {
    display: flex;
    gap: 10px;
}

.product-buttons .btn {
    flex: 1;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
}

.carousel-indicators {
    bottom: 5px;
}

.carousel-indicators li {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.carousel-control-prev,
.carousel-control-next {
    width: 30px;
    height: 30px;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
}

.carousel-control-prev {
    left: 10px;
}

.carousel-control-next {
    right: 10px;
}

.carousel-control-prev-icon,
.carousel-control-next-icon {
    width: 15px;
    height: 15px;
}

.modal-lg {
    max-width: 800px;
}

.delete-image-btn {
    font-size: 0.8em;
}
</style>
`;

// Inject additional styles
$('head').append(additionalStyles);