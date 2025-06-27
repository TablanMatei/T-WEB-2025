//  VARIABILE GLOBALE
let currentStep = 1;

//  INIȚIALIZARE
document.addEventListener('DOMContentLoaded', function() {
    initializeSignupPage();
});

function initializeSignupPage() {
    updateStepBar();
    setupFormValidation();
    console.log('Signup page initialized');
}

//  NAVIGARE PRIN PAȘI
function nextStep() {
    if (!validateCurrentStep()) {
        return;
    }

    // Ascunde pasul curent
    const currentStepElement = document.getElementById(`step-${currentStep}-content`);
    if (currentStepElement) {
        currentStepElement.style.display = "none";
    }

    // Trece la următorul pas
    currentStep++;

    // Afișează noul pas
    const nextStepElement = document.getElementById(`step-${currentStep}-content`);
    if (nextStepElement) {
        nextStepElement.style.display = "flex";
    }

    updateStepBar();
}

function previousStep() {
    if (currentStep <= 1) return;

    // Ascunde pasul curent
    const currentStepElement = document.getElementById(`step-${currentStep}-content`);
    if (currentStepElement) {
        currentStepElement.style.display = "none";
    }

    // Trece la pasul anterior
    currentStep--;

    // Afișează pasul anterior
    const prevStepElement = document.getElementById(`step-${currentStep}-content`);
    if (prevStepElement) {
        prevStepElement.style.display = "flex";
    }

    updateStepBar();
}

function updateStepBar() {
    for (let i = 1; i <= 3; i++) {
        const bar = document.getElementById(`bar-${i}`);
        if (bar) {
            bar.className = 'step-bar';
            if (i < currentStep) {
                bar.classList.add('completed');
            } else if (i === currentStep) {
                bar.classList.add('active');
            }
        }
    }
}

//  VALIDARE
function validateCurrentStep() {
    clearMessages();

    if (currentStep === 1) {
        return validateStep1();
    } else if (currentStep === 2) {
        return validateStep2();
    } else if (currentStep === 3) {
        return validateStep3();
    }

    return true;
}

function validateStep1() {
    const name = document.getElementById("name")?.value.trim();
    const username = document.getElementById("username")?.value.trim();

    if (!name || name.length < 2) {
        showMessage("Please enter your full name (at least 2 characters)", "error");
        return false;
    }

    if (!username || username.length < 3) {
        showMessage("Username must be at least 3 characters", "error");
        return false;
    }

    // Validare username - doar litere, cifre și underscore
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        showMessage("Username can only contain letters, numbers, and underscores", "error");
        return false;
    }

    return true;
}

function validateStep2() {
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;
    const confirmPassword = document.getElementById("confirmPassword")?.value;

    if (!email || !isValidEmail(email)) {
        showMessage("Please enter a valid email address", "error");
        return false;
    }

    if (!password || password.length < 6) {
        showMessage("Password must be at least 6 characters", "error");
        return false;
    }


    if (confirmPassword && password !== confirmPassword) {
        showMessage("Passwords do not match", "error");
        return false;
    }

    return true;
}

function validateStep3() {
    const birthdate = document.getElementById("birthdate")?.value;

    if (birthdate) {
        const age = calculateAge(new Date(birthdate));
        if (age < 13) {
            showMessage("You must be at least 13 years old to register", "error");
            return false;
        }
        if (age > 120) {
            showMessage("Please enter a valid birthdate", "error");
            return false;
        }
    }

    return true;
}

//  FUNCȚII HELPER
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

//  VERIFICARE USERNAME DISPONIBIL
async function checkUsernameAvailability() {
    const username = document.getElementById("username")?.value.trim();
    const usernameInput = document.getElementById("username");

    if (!username || username.length < 3) return;

    try {
        const response = await fetch('/backend/api/check_username.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        });

        const result = await response.json();

        if (result.available === false) {
            usernameInput?.classList.add('error');
            showMessage("Username is already taken", "error");
        } else if (result.available === true) {
            usernameInput?.classList.remove('error');
            usernameInput?.classList.add('success');
        }

    } catch (error) {
        console.error('Error checking username:', error);
    }
}

//  SETUP VALIDARE REAL-TIME
function setupFormValidation() {
    const usernameInput = document.getElementById("username");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    // Username availability check
    if (usernameInput) {
        let usernameTimeout;
        usernameInput.addEventListener('input', function() {
            clearTimeout(usernameTimeout);
            usernameTimeout = setTimeout(checkUsernameAvailability, 500);
        });
    }

    // Email validation
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }

    // Password confirmation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput?.value;
            const confirmPassword = this.value;

            if (confirmPassword && password !== confirmPassword) {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    }
}

//  MESAJE
function showMessage(message, type) {
    clearMessages();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Stilizare inline pentru mesaje
    messageDiv.style.cssText = `
        padding: 12px 16px;
        margin: 10px 0;
        border-radius: 5px;
        font-weight: 500;
        ${type === 'success' ? 'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
        ${type === 'error' ? 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
        ${type === 'warning' ? 'background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7;' : ''}
    `;

    const formSection = document.querySelector('.form-section');
    if (formSection && formSection.children.length > 1) {
        formSection.insertBefore(messageDiv, formSection.children[1]);
    } else if (formSection) {
        formSection.appendChild(messageDiv);
    }

    // Auto-remove după 5 secunde
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function clearMessages() {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(message => message.remove());
}

//  SUBMIT FORMULAR
async function submitForm() {
    const submitButton = document.querySelector('button[type="submit"], .submit-btn');
    if (!submitButton) return;

    const originalText = submitButton.textContent;

    // Validare finală
    if (!validateAllSteps()) {
        return;
    }

    // Disable button during submission
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    // Colectează datele din formular cu sanitizare
    const userData = {
        real_name: sanitizeInput(document.getElementById("name")?.value.trim()),
        username: sanitizeInput(document.getElementById("username")?.value.trim()),
        email: sanitizeInput(document.getElementById("email")?.value.trim()),
        password: document.getElementById("password")?.value, // Nu sanitiza parola
        description: sanitizeInput(document.getElementById("bio")?.value.trim() || ''),
        birthdate: document.getElementById("birthdate")?.value || null,
        gender: document.getElementById("gender")?.value || null
    };

    try {
        const response = await fetch('/backend/auth/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        console.log('Registration response:', result);

        if (response.ok && result.success) {
            showMessage("Account created successfully! Redirecting to login...", "success");

            // Redirect după 2 secunde
            setTimeout(() => {
                window.location.href = '../authPage/authPage.html';
            }, 2000);

        } else {
            showMessage(result.error || 'Registration failed. Please try again.', "error");
        }

    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', "error");
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

//  VALIDARE COMPLETĂ
function validateAllSteps() {
    // Salvează pasul curent
    const originalStep = currentStep;

    // Validează fiecare pas
    for (let step = 1; step <= 3; step++) {
        currentStep = step;
        if (!validateCurrentStep()) {
            currentStep = originalStep;
            return false;
        }
    }

    // Restaurează pasul curent
    currentStep = originalStep;
    return true;
}

// XSS
function sanitizeInput(input) {
    if (!input) return '';
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/[<>]/g, '')
        .trim();
}

//EVENT LISTENERS
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;

        // Dacă suntem într-un input, încearcă să mergi la următorul pas
        if (activeElement && activeElement.tagName === 'INPUT') {
            e.preventDefault();

            if (currentStep < 3) {
                nextStep();
            } else {
                submitForm();
            }
        }
    }
});

// Previne submit-ul accidental al formularului
document.addEventListener('submit', function(e) {
    e.preventDefault();
    submitForm();
});