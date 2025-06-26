// Verifică dacă utilizatorul e deja logat
document.addEventListener('DOMContentLoaded', function() {
    if (isUserLoggedIn()) {
        window.location.href = '../mainPage/index.html';
        return;
    }

    initializeAuthPage();
});

function initializeAuthPage() {
    console.log('Initializing auth page...');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    console.log('Login form:', loginForm);
    console.log('Register form:', registerForm);

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            console.log('Login form submitted!');
            e.preventDefault();
            handleLogin(e);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            console.log('Register form submitted!');
            e.preventDefault();
            handleRegister(e);
        });
    }
}

// Funcții helper pentru JWT
function isUserLoggedIn() {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) return false;

    try {
        const payload = parseJWT(token);
        return payload.exp > Math.floor(Date.now() / 1000);
    } catch (error) {
        return false;
    }
}

function parseJWT(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}

// Switch între login și register
function showRegister() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    clearMessages();
}

function showLogin() {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
    clearMessages();
}

// Login handler
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitButton = document.querySelector('#loginForm button[type="submit"]');

    if (!username || !password) {
        showMessage('loginMessage', 'Please fill in all fields', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';

    try {
        const response = await fetch('/backend/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            sessionStorage.setItem('jwt_token', result.token);
            showMessage('loginMessage', 'Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = '../mainPage/index.html';
            }, 1000);
        } else {
            showMessage('loginMessage', result.error || 'Login failed', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', 'Network error. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitButton = document.querySelector('#registerForm button[type="submit"]');

    if (!username || !email || !password || !confirmPassword) {
        showMessage('registerMessage', 'Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('registerMessage', 'Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('registerMessage', 'Password must be at least 6 characters', 'error');
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    try {
        const response = await fetch('/backend/auth/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showMessage('registerMessage', 'Account created successfully! Please login.', 'success');
            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            showMessage('registerMessage', result.error || 'Registration failed', 'error');
        }

    } catch (error) {
        console.error('Register error:', error);
        showMessage('registerMessage', 'Network error. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
}

// Helper functions
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
}

function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        msg.style.display = 'none';
        msg.textContent = '';
    });
}