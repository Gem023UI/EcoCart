$(document).ready(function () {
    const apiUrl = 'http://localhost:4000/api/v1/product';

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
                        <button class="prod-btn">Add to Cart</button>
                        <button class="prod-btn">Buy Now</button>
                    </div>
                </div>
            `;
            $container.append(card);
        });
    }

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            renderProducts(data.products);
        },
        error: function () {
            $('#products-container').html('<p>Ayaw lumabas ng products punyeta.</p>');
        }
    });

    // Optional: handle "View" button click
    $('#products-container').on('click', '.view-btn', function () {
        const productId = $(this).data('id');
        // Redirect or show modal, etc.
        window.location.href = `product-details.html?id=${productId}`;
    });
});