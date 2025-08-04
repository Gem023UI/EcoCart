$(document).ready(function () {
    // ✅ Fixed Admin authentication check
    function requireAdmin() {
        const userId = sessionStorage.getItem('userId');
        const authToken = sessionStorage.getItem('authToken');
        const roleId = sessionStorage.getItem('roleId');

        console.log('Auth check - userId:', userId, 'authToken:', authToken, 'roleId:', roleId); // Debug log

        // Check if user is logged in
        if (!userId || !authToken) {
            Swal.fire({
                icon: 'warning',
                title: 'Login Required',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                window.location.href = 'loginregister.html';
            });
            return false;
        }

        // Check if user is admin (roleId should be '1' or 1)
        if (roleId !== '1' && parseInt(roleId) !== 1) {
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Administrator privileges required to access this page.',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                window.location.href = 'loginregister.html';
            });
            return false;
        }

        return true;
    }

    // Execute admin check first and stop execution if not authorized
    if (!requireAdmin()) {
        return; // Stop all execution if not authorized
    }

    // Only load admin header and continue if authentication passes
    $('#adminheader').load('./adminheader.html');
    
    const url = 'http://localhost:4000/';

    // Initialize DataTable only after successful authentication
    var table = $('#ptable').DataTable({
        ajax: {
            url: `${url}api/v1/productTable/`,
            dataSrc: "rows",
            error: function(xhr, error, code) {
                console.error('DataTable AJAX error:', error, code);
                if (xhr.status === 401) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Session Expired',
                        text: 'Your session has expired. Please log in again.',
                        showConfirmButton: true
                    }).then(() => {
                        sessionStorage.clear();
                        window.location.href = 'loginregister.html';
                    });
                }
            }
        },
        processing: false,
        dom: 'Bfrtip',
        buttons: [
            'pdf',
            'excel',
            {
                text: 'Add Product',
                className: 'btn btn-primary',
                action: function (e, dt, node, config) {
                    $("#pform").trigger("reset");
                    $('#productModal').modal('show');
                    $('#productUpdate').hide();
                    $('#productImages').empty();
                    $('#productSubmit').show();
                }
            }
        ],
        columns: [
            { data: 'ProductID' },
            { data: 'Category' },
            { data: 'Name' },
            { data: 'Description' },
            { data: 'Price' },
            { data: 'Stocks' },
            {
                data: null,
                render: function (data, type, row) {
                    let imagesHtml = '';
                    if (data.images && data.images.length > 0) {
                        data.images.forEach(image => {
                            imagesHtml += `<img src="${url}${image.Image}" width="30" height="30" style="margin:2px; border-radius:3px;">`;
                        });
                    } else {
                        imagesHtml = '<span class="text-muted">No images</span>';
                    }
                    return imagesHtml;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    return "<a href='#' class='editBtn' id='editbtn' data-id=" + data.ProductID + "><i class='fas fa-edit' aria-hidden='true' style='font-size:24px; color:#007bff; margin-right:10px;'></i></a><a href='#' class='deletebtn' data-id=" + data.ProductID + "><i class='fas fa-trash-alt' style='font-size:24px; color:red'></i></a>";
                }
            }
        ],
    });

    // Category filter functionality
    $('#categoryFilter').on('change', function() {
        var selectedCategory = $(this).val();
        table.column(1).search(selectedCategory).draw();
    });

    // Search functionality
    $('#searchProduct').on('keyup', function() {
        table.search($(this).val()).draw();
    });

    // Clear filters
    $('#clearFilters').on('click', function() {
        $('#categoryFilter').val('');
        $('#searchProduct').val('');
        table.search('').columns().search('').draw();
    });

    // Helper function to get auth headers
    function getAuthHeaders() {
        const authToken = sessionStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };
    }

    // Helper function to handle authentication errors
    function handleAuthError(xhr) {
        if (xhr.status === 401 || xhr.status === 403) {
            Swal.fire({
                icon: 'warning',
                title: 'Session Expired',
                text: 'Your session has expired. Please log in again.',
                showConfirmButton: true
            }).then(() => {
                sessionStorage.clear();
                window.location.href = 'loginregister.html';
            });
            return true;
        }
        return false;
    }

    $("#productSubmit").on('click', function (e) {
        e.preventDefault();
        var data = $('#pform')[0];
        let formData = new FormData(data);

        console.log('Form data entries:');
        for (var pair of formData.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/productAdd/`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
            success: function (data) {
                console.log(data);
                $("#productModal").modal("hide");
                $('#ptable').DataTable().ajax.reload();
                showAlert('success', 'Product created successfully!');
            },
            error: function (xhr) {
                console.log(xhr);
                if (!handleAuthError(xhr)) {
                    showAlert('error', 'Error creating product: ' + (xhr.responseJSON?.error || 'Unknown error'));
                }
            }
        });
    });

    $('#ptable tbody').on('click', 'a.editBtn', function (e) {
        e.preventDefault();
        $('#productImages').empty();
        $('#productId').remove();
        $("#pform").trigger("reset");

        var id = $(this).data('id');
        console.log(id);
        $('#productModal').modal('show');
        $('<input>').attr({ type: 'hidden', id: 'productId', name: 'product_id', value: id }).appendTo('#pform');

        $('#productSubmit').hide();
        $('#productUpdate').show();

        $.ajax({
            method: "GET",
            url: `${url}api/v1/productFetch/${id}`,
            dataType: "json",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
            success: function (data) {
                const { result } = data;
                console.log(result);
                
                if (result.length > 0) {
                    const product = result[0];
                    $('#productCategory').val(product.ProdCategoryID);
                    $('#productName').val(product.Name);
                    $('#productDescription').val(product.Description);
                    $('#productPrice').val(product.Price);
                    $('#productStocks').val(product.Stocks);
                    
                    // Display existing images
                    if (product.images && product.images.length > 0) {
                        let imagesHtml = '<div class="existing-images"><h6>Current Images:</h6>';
                        product.images.forEach((image, index) => {
                            imagesHtml += `
                                <div class="image-item" style="display:inline-block; margin:5px; position:relative;">
                                    <img src="${url}${image.Image}" width="100" height="100" style="border-radius:5px; border:1px solid #ddd;">
                                    <button type="button" class="btn btn-danger btn-sm remove-image" data-image-id="${image.ProductImageID}" style="position:absolute; top:-5px; right:-5px; border-radius:50%; width:25px; height:25px; padding:0; font-size:12px;">&times;</button>
                                </div>
                            `;
                        });
                        imagesHtml += '</div>';
                        $("#productImages").html(imagesHtml);
                    }
                }
            },
            error: function (xhr) {
                console.log(xhr);
                if (!handleAuthError(xhr)) {
                    showAlert('error', 'Error loading product details');
                }
            }
        });
    });

    // Remove individual image
    $(document).on('click', '.remove-image', function(e) {
        e.preventDefault();
        const imageId = $(this).data('image-id');
        const imageElement = $(this).closest('.image-item');
        
        bootbox.confirm({
            message: "Do you want to remove this image?",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-danger'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-secondary'
                }
            },
            callback: function (result) {
                if (result) {
                    $.ajax({
                        method: "DELETE",
                        url: `${url}api/v1/image/${imageId}`,
                        dataType: "json",
                        headers: {
                            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                        },
                        success: function (data) {
                            console.log(data);
                            imageElement.fadeOut(300, function() {
                                $(this).remove();
                            });
                            showAlert('success', 'Image removed successfully!');
                        },
                        error: function (xhr) {
                            console.log(xhr);
                            if (!handleAuthError(xhr)) {
                                showAlert('error', 'Error removing image');
                            }
                        }
                    });
                }
            }
        });
    });

    $("#productUpdate").on('click', function (e) {
        e.preventDefault();
        var id = $('#productId').val();
        let formData = new FormData($('#pform')[0]);

        $.ajax({
            method: "PUT",
            url: `${url}api/v1/productUpdate/${id}`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
            },
            success: function (data) {
                console.log(data);
                $('#productModal').modal("hide");
                $('#ptable').DataTable().ajax.reload();
                showAlert('success', 'Product updated successfully!');
            },
            error: function (xhr) {
                console.log(xhr);
                if (!handleAuthError(xhr)) {
                    showAlert('error', 'Error updating product: ' + (xhr.responseJSON?.error || 'Unknown error'));
                }
            }
        });
    });

    $('#ptable tbody').on('click', 'a.deletebtn', function (e) {
        e.preventDefault();
        var table = $('#ptable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');
        console.log(id);
        
        bootbox.confirm({
            message: "Do you want to delete this product and all its images?",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-danger'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-secondary'
                }
            },
            callback: function (result) {
                console.log(result);
                if (result) {
                    $.ajax({
                        method: "DELETE",
                        url: `${url}api/v1/productDelete/${id}`,
                        dataType: "json",
                        headers: {
                            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                        },
                        success: function (data) {
                            console.log(data);
                            $row.fadeOut(400, function () {
                                table.row($row).remove().draw();
                            });
                            showAlert('success', data.message || 'Product deleted successfully!');
                        },
                        error: function (xhr) {
                            console.log(xhr);
                            if (!handleAuthError(xhr)) {
                                showAlert('error', 'Error deleting product: ' + (xhr.responseJSON?.error || 'Unknown error'));
                            }
                        }
                    });
                }
            }
        });
    });

    // Utility function to show alerts
    function showAlert(type, message) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
        
        // Create alert container if it doesn't exist
        if ($('#alertContainer').length === 0) {
            $('body').prepend('<div id="alertContainer" style="position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;"></div>');
        }
        
        $('#alertContainer').html(alertHtml);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            $('.alert').alert('close');
        }, 5000);
    }

    // Preview multiple images before upload
    $('#productImageFiles').on('change', function(e) {
        const files = e.target.files;
        const previewContainer = $('#imagePreview');
        previewContainer.empty();
        
        if (files.length > 0) {
            previewContainer.append('<h6>New Images Preview:</h6>');
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const imageHtml = `
                        <div class="preview-item" style="display:inline-block; margin:5px;">
                            <img src="${e.target.result}" width="80" height="80" style="border-radius:5px; border:1px solid #ddd;">
                            <div style="font-size:12px; text-align:center; margin-top:2px;">${file.name}</div>
                        </div>
                    `;
                    previewContainer.append(imageHtml);
                };
                
                reader.readAsDataURL(file);
            }
        }
    });

    $("#productModal").on('hidden.bs.modal', function () {
        $('#productImageFiles').val('');
        $('#imagePreview').empty();
    });

    // Additional safety check - monitor sessionStorage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'authToken' || e.key === 'userId' || e.key === 'roleId') {
            if (!e.newValue) {
                // Session data was cleared, redirect to login
                window.location.href = 'loginregister.html';
            }
        }
    });

    // Prevent accidental page refresh from clearing session
    $(window).on('beforeunload', function(e) {
        // Only show warning if there are unsaved changes
        if ($('#productModal').is(':visible')) {
            return 'You have unsaved changes. Are you sure you want to leave?';
        }
    });
});