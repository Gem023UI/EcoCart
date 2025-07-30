$(document).ready(function () {
    const url = 'http://localhost:4000/'

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
            return;
        }
        return true
    }
    // DONE REGISTER FUNCTION
    $("#registerForm").on('submit', function (e) {
    e.preventDefault();
    
    // Get form values
    let firstname = $("#register-firstname").val().trim();
    let lastname = $("#register-lastname").val().trim();
    let email = $("#register-email").val().trim();
    let password = $("#register-password").val();

    // Basic validation
    if (!firstname || !lastname || !email || !password) {
        Swal.fire({
            icon: "error",
            text: "Please fill in all required fields.",
            position: 'top-center'
        });
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Swal.fire({
            icon: "error",
            text: "Please enter a valid email address.",
            position: 'top-center'
        });
        return;
    }
    
    // Password validation (minimum 6 characters)
    if (password.length < 6) {
        Swal.fire({
            icon: "error",
            text: "Password must be at least 6 characters long.",
            position: 'top-center'
        });
        return;
    }
    
    // Create user object with only required fields
    let user = {
        firstname,
        lastname,
        email,
        password
    };
    
    // Show loading state
    Swal.fire({
        title: "Registering...",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Send AJAX request
    $.ajax({
        method: "POST",
        url: `${url}api/v1/register`,
        data: JSON.stringify(user),
        processData: false,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (data) {
            console.log("Registration successful:", data);
            Swal.fire({
                icon: "success",
                title: "Registration Successful!",
                text: "Your account has been created successfully.",
                position: 'top-center'
            }).then(() => {
                // Reset form after successful registration
                $("#registerForm")[0].reset();
                // Optionally redirect to login page
                // window.location.href = '/login';
            });
        },
        error: function (xhr) {
            console.error("Registration error:", xhr);
            
            let errorMessage = "Registration failed. Please try again.";
            
            if (xhr.responseJSON) {
                errorMessage = xhr.responseJSON.error || errorMessage;
                
                // Handle specific error details
                if (xhr.responseJSON.details) {
                    console.error("Error details:", xhr.responseJSON.details);
                }
            }
            
            Swal.fire({
                icon: "error",
                title: "Registration Failed",
                text: errorMessage,
                position: 'top-center'
            });
        }
    });
    });
    // DONE LOGIN W/ JSON WEB TOKEN FUNCTION + ADMIN/CUSTOMER FILTER & REDIRECT
    $("#loginForm").on('submit', function (e) {
    e.preventDefault();

    let email = $("#login-email").val();
    let password = $("#login-password").val();
    let user = {
        email,
        password
    };
    $.ajax({
        method: "POST",
        url: `${url}api/v1/login`,
        data: JSON.stringify(user),
        processData: false,
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (data) {
            console.log(data);
            Swal.fire({
                icon: "success",
                title: "Login Successful!",
                text: data.message,
                showConfirmButton: false,
                position: 'top-center',
                timer: 2000,
                timerProgressBar: true
            });

            // Place this in your frontend login AJAX success handler
            if (data.success) {
                // Store token as adminToken or userToken based on tokenKey
                sessionStorage.setItem(data.tokenKey, data.token);
                // Also store userId and roleId for reference
                sessionStorage.setItem('userId', data.user.userId);
                sessionStorage.setItem('roleId', data.user.roleId);
            }

            // Check user role and redirect accordingly
            if (data.user.roleId === 2) {
                window.location.href = 'landingpage.html'; // Customer
            } else if (data.user.roleId === 1) {
                window.location.href = 'dashboard.html'; // Admin
            } else {
                Swal.fire({
                    icon: "error",
                    text: "Unknown user role.",
                    position: 'center'
                });
            }
        },
        error: function (error) {
            console.log(error);
            Swal.fire({
                icon: "error",
                text: error.responseJSON.message,
                showConfirmButton: false,
                position: 'center',
                timer: 1000,
                timerProgressBar: true
            });
        }
    });
    });

    $('#avatar').on('change', function () {
        const file = this.files[0];
        console.log(file)
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $("#updateBtn").on('click', function (event) {
        event.preventDefault();
        userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')

        var data = $('#profileForm')[0];
        console.log(data);
        let formData = new FormData(data);
        formData.append('userId', userId)

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $("#profile").load("header.html", function () {
        // After header is loaded, check sessionStorage for userId
        if (sessionStorage.getItem('userId')) {
            // Change Login link to Logout
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }
    });

    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true
                });
                sessionStorage.removeItem('userId')
                // window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });
})
