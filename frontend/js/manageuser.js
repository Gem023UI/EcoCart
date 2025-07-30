const apiUrl = 'http://localhost:4000/api/v1/userTable';

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
        return false; // Return false instead of undefined
    }
    return true;
}

function loadUsers() {
    // Check authentication first
    if (!getToken()) {
        return;
    }

    console.log('Loading users from:', apiUrl); // Debug log
    
    $.get(apiUrl)
        .done(function(users) {
            console.log('Users loaded:', users); // Debug log
            
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
                        <td>${user.FirstName}</td>
                        <td>${user.LastName}</td>
                        <td>${user.Address}</td>
                        <td>${user.Email}</td>
                        <td>${user.PhoneNumber}</td>
                        <td>${user.RoleID == 1 ? 'Admin' : user.RoleID == 2 ? 'Customer' : 'Unknown'}</td>
                        <td>${user.StatusID == 1 ? 'Active' : user.StatusID == 2 ? 'Deactivated' : 'Unknown'}</td>
                        <td class="table-actions">
                            <button class="btn btn-sm btn-info edit-btn" data-id="${user.UserID}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${user.UserID}">Delete</button>
                        </td>
                    </tr>
                `);
            });
        })
        .fail(function(xhr, status, error) {
            console.error('Error loading users:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            
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

$(document).ready(function() {
    loadUsers();

    // Edit button click
    $('#usersTable').on('click', '.edit-btn', function() {
        console.log('Edit button clicked'); // Debug log
        const userId = $(this).data('id');
        console.log('User ID:', userId); // Debug log
        
        $.get(`http://localhost:4000/api/v1/userEdit/${userId}`)
            .done(function(user) {
                console.log('User data received:', user); // Debug log
                $('#editUserId').val(user.UserID);
                $('#editFirstName').val(user.FirstName);
                $('#editLastName').val(user.LastName);
                $('#editAddress').val(user.Address);
                $('#editEmail').val(user.Email);
                $('#editPhoneNumber').val(user.PhoneNumber);
                $('#editRole').val(user.RoleID);
                $('#editStatus').val(user.StatusID);
                
                // Show modal with Bootstrap 4 method
                $('#editUserModal').modal('show');
            })
            .fail(function(xhr, status, error) {
                console.error('Error fetching user:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch user details.'
                });
            });
    });

    // Edit form submit
    $('#editUserForm').submit(function(e) {
        e.preventDefault();
        const userId = $('#editUserId').val();
        $.ajax({
            url: `http://localhost:4000/api/v1/userUpdate/${userId}`,
            method: 'PUT',
            contentType: 'application/json',
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
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update user.'
                });
            }
        });
    });

    // Delete button click
    $('#usersTable').on('click', '.delete-btn', function() {
        const userId = $(this).data('id');
        
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
});

$(document).ready(function() {
    $('#adminheader').load('./adminheader.html');
});