const apiUrl = 'http://localhost:4000/api/v1/userTable';
let allUsers = []; // Store all users for filtering
let filteredUsers = []; // Store filtered users

$(document).ready(function() {
    console.log('Document ready - checking authentication...'); // Debug log

    // ✅ Comprehensive Admin authentication check
    function requireAdmin() {
        const userId = sessionStorage.getItem('userId');
        const authToken = sessionStorage.getItem('authToken');
        const roleId = sessionStorage.getItem('roleId');
        
        console.log('Auth check - userId:', userId, 'authToken:', authToken ? 'present' : 'missing', 'roleId:', roleId); // Debug log
        
        // Check if user is logged in
        if (!userId || !authToken) {
            console.log('Authentication failed - missing credentials'); // Debug log
            Swal.fire({
                icon: 'warning',
                title: 'Login Required',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                timer: null, // Remove any auto-close timer
                timerProgressBar: false
            }).then((result) => {
                console.log('Swal result:', result); // Debug log
                // Only redirect after user acknowledges the dialog
                window.location.href = 'loginregister.html';
            });
            return false;
        }
        
        // Check if user is admin (roleId should be '1' or 1)
        if (roleId !== '1' && parseInt(roleId) !== 1) {
            console.log('Authorization failed - insufficient privileges, roleId:', roleId); // Debug log
            Swal.fire({
                icon: 'error',
                title: 'Access Denied',
                text: 'Administrator privileges required to access this page.',
                showConfirmButton: true,
                allowOutsideClick: false,
                allowEscapeKey: false,
                timer: null, // Remove any auto-close timer
                timerProgressBar: false
            }).then((result) => {
                console.log('Swal result:', result); // Debug log
                // Only redirect after user acknowledges the dialog
                window.location.href = 'loginregister.html';
            });
            return false;
        }
        
        console.log('Authentication successful'); // Debug log
        return true;
    }
    
    // Execute admin check first
    if (!requireAdmin()) {
        console.log('Authentication failed, stopping execution'); // Debug log
        return; // Stop execution if not authorized
    }
    
    console.log('Loading admin interface...'); // Debug log
    // Load admin header only after successful authentication
    $('#adminheader').load('./adminheader.html');
    
    // Initialize the user management functionality
    initializeUserManagement();
});

function getToken() {
    const userId = sessionStorage.getItem('userId');
    const authToken = sessionStorage.getItem('authToken');
    return { userId, authToken };
}

function loadUsers() {
    const { authToken } = getToken();
    // Check authentication first
    if (!authToken) {
        console.log('No auth token available for loading users');
        return;
    }

    console.log('Loading users from:', apiUrl); // Debug log
    
    $.ajax({
        url: apiUrl,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .done(function(users) {
        console.log('Users loaded:', users); // Debug log
        
        // Store all users globally for filtering
        allUsers = users || [];
        filteredUsers = [...allUsers]; // Initialize filtered users
        
        renderUsersTable(filteredUsers);
    })
    .fail(function(xhr, status, error) {
        console.error('Error loading users:', error);
        console.error('Status:', status);
        console.error('Response:', xhr.responseText);
        
        // Handle authentication errors
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
            return;
        }
        
        const tbody = $('#usersTable tbody');
        tbody.empty();
        tbody.append('<tr><td colspan="9" class="text-center text-danger">Error loading users. Please try again.</td></tr>');
        
        // Show user-friendly error
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load users. Please check your connection and try again.'
        });
    });
}

function renderUsersTable(users) {
    const tbody = $('#usersTable tbody');
    tbody.empty();
    
    if (!users || users.length === 0) {
        tbody.append('<tr><td colspan="9" class="text-center">No users found</td></tr>');
        return;
    }
    
    users.forEach(user => {
        tbody.append(`
            <tr>
                <td>${user.UserID}</td>
                <td>${user.FirstName || ''}</td>
                <td>${user.LastName || ''}</td>
                <td>${user.Address || 'N/A'}</td>
                <td>${user.Email || ''}</td>
                <td>${user.PhoneNumber || 'N/A'}</td>
                <td>${user.RoleID == 1 ? 'Admin' : user.RoleID == 2 ? 'Customer' : 'Unknown'}</td>
                <td>${user.StatusID == 1 ? 'Active' : user.StatusID == 2 ? 'Deactivated' : 'Unknown'}</td>
                <td class="table-actions">
                    <button class="btn btn-sm btn-info edit-btn" data-id="${user.UserID}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${user.UserID}">Delete</button>
                </td>
            </tr>
        `);
    });
}

function initializeUserManagement() {
    console.log('Initializing user management...'); // Debug log
    
    // Load users initially
    loadUsers();

    // Edit button click handler
    $('#usersTable').on('click', '.edit-btn', function() {
        const userId = $(this).data('id');
        const { authToken } = getToken();
        
        console.log('Edit button clicked for user:', userId); // Debug log
        
        $.ajax({
            url: `http://localhost:4000/api/v1/userEdit/${userId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .done(function(user) {
            console.log('User data received:', user); // Debug log
            $('#editUserId').val(user.UserID);
            $('#editFirstName').val(user.FirstName || '');
            $('#editLastName').val(user.LastName || '');
            $('#editAddress').val(user.Address || '');
            $('#editEmail').val(user.Email || '');
            $('#editPhoneNumber').val(user.PhoneNumber || '');
            $('#editRole').val(user.RoleID);
            $('#editStatus').val(user.StatusID);
            
            // Show modal
            $('#editUserModal').modal('show');
        })
        .fail(function(xhr, status, error) {
            console.error('Error fetching user:', error);
            
            // Handle authentication errors
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
                return;
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch user details.'
            });
        });
    });

    // Edit form submit handler
    $('#editUserForm').submit(function(e) {
        e.preventDefault();
        const userId = $('#editUserId').val();
        const { authToken } = getToken();
        
        $.ajax({
            url: `http://localhost:4000/api/v1/userUpdate/${userId}`,
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                firstname: $('#editFirstName').val(),
                lastname: $('#editLastName').val(),
                address: $('#editAddress').val(),
                email: $('#editEmail').val(),
                phone: $('#editPhoneNumber').val(),
                roleId: $('#editRole').val(),
                statusId: $('#editStatus').val()
            }),
            success: function() {
                $('#editUserModal').modal('hide');
                loadUsers();
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'User updated successfully!'
                });
            },
            error: function(xhr, status, error) {
                console.error('Error updating user:', error);
                
                // Handle authentication errors
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
                    return;
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update user.'
                });
            }
        });
    });

    // Delete button click handler
    $('#usersTable').on('click', '.delete-btn', function() {
        const userId = $(this).data('id');
        const { authToken } = getToken();
        
        Swal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#003023',
            cancelButtonColor: '#7ed957',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `http://localhost:4000/api/v1/userDelete/${userId}`,
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    success: function() {
                        loadUsers();
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'User has been deleted.'
                        });
                    },
                    error: function(xhr, status, error) {
                        console.error('Error deleting user:', error);
                        
                        // Handle authentication errors
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
                            return;
                        }
                        
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to delete user.'
                        });
                    }
                });
            }
        });
    });

    // Additional safety check - monitor sessionStorage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'authToken' || e.key === 'userId' || e.key === 'roleId') {
            if (!e.newValue) {
                // Session data was cleared, redirect to login
                console.log('Session data cleared, redirecting to login');
                window.location.href = 'loginregister.html';
            }
        }
    });

    // Filter functionality
    function applyFilters() {
        const roleFilter = $('#roleFilter').val();
        const statusFilter = $('#statusFilter').val();
        const searchQuery = $('#searchUser').val().toLowerCase();
        
        filteredUsers = allUsers.filter(user => {
            const matchesRole = roleFilter === '' || user.RoleID.toString() === roleFilter;
            const matchesStatus = statusFilter === '' || user.StatusID.toString() === statusFilter;
            const matchesSearch = searchQuery === '' || 
                (user.FirstName && user.FirstName.toLowerCase().includes(searchQuery)) ||
                (user.LastName && user.LastName.toLowerCase().includes(searchQuery)) ||
                (user.Email && user.Email.toLowerCase().includes(searchQuery)) ||
                (user.PhoneNumber && user.PhoneNumber.toLowerCase().includes(searchQuery)) ||
                (user.Address && user.Address.toLowerCase().includes(searchQuery));
            
            return matchesRole && matchesStatus && matchesSearch;
        });
        
        renderUsersTable(filteredUsers);
    }

    // Role filter change handler
    $('#roleFilter').on('change', applyFilters);
    
    // Status filter change handler
    $('#statusFilter').on('change', applyFilters);
    
    // Search input handler
    $('#searchUser').on('keyup', applyFilters);
    
    // Clear filters handler
    $('#clearFilters').on('click', function() {
        $('#roleFilter').val('');
        $('#statusFilter').val('');
        $('#searchUser').val('');
        filteredUsers = [...allUsers];
        renderUsersTable(filteredUsers);
    });
}