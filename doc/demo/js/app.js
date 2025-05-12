// Main application JavaScript file

$(document).ready(function() {
    // Login functionality
    $('#login-btn').on('click', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        // Simple validation
        if (!username || !password) {
            alert('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
            return;
        }
        
        // Mock authentication - in a real app this would be an API call
        if (username === 'parent' && password === 'password') {
            // Redirect to parent dashboard
            window.location.href = 'parent-dashboard.html';
        } else if (username === 'admin' && password === 'password') {
            // Redirect to manager dashboard
            window.location.href = 'manager-dashboard.html';
        } else {
            alert('Tên đăng nhập hoặc mật khẩu không chính xác');
        }
    });
    
    // Handle logout (this will be used in both dashboards)
    $('#logout-btn').on('click', function() {
        // In a real app, this would involve clearing session/token
        window.location.href = 'index.html';
    });
});