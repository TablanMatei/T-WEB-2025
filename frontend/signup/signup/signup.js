let currentStep = 1;

function nextStep() {

    if (!validateCurrentStep()) {
        return;
    }

    document.getElementById(`step-${currentStep}-content`).style.display = "none";
    currentStep++;
    document.getElementById(`step-${currentStep}-content`).style.display = "flex";
    updateStepBar();
}

function updateStepBar() {
    for (let i = 1; i <= 3; i++) {
        const bar = document.getElementById(`bar-${i}`);
        bar.className = 'step-bar';
        if (i < currentStep) bar.classList.add('completed');
        else if (i === currentStep) bar.classList.add('active');
    }
}
function validateCurrentStep() {
    if (currentStep === 1) {
        const name = document.getElementById("name").value.trim();
        const username = document.getElementById("username").value.trim();

        if (!name) {
            showMessage("Please enter your name", "error");
            return false;
        }
        if (!username || username.length < 3) {
            showMessage("Username must be at least 3 characters", "error");
            return false;
        }
    } else if (currentStep === 2) {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !isValidEmail(email)) {
            showMessage("Please enter a valid email", "error");
            return false;
        }
        if (!password || password.length < 6) {
            showMessage("Password must be at least 6 characters", "error");
            return false;
        }
    }
    return true;
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type) {
    // Elimină mesajul anterior dacă există
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Creează noul mesaj
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Adaugă mesajul la începutul form-section
    const formSection = document.querySelector('.form-section');
    formSection.insertBefore(messageDiv, formSection.children[1]); // După titlu

    // Elimină mesajul după 5 secunde
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

async function submitForm() {
    const submitButton = document.querySelector('button');
    const originalText = submitButton.textContent;

    // Disable button during submission
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    // Colectează datele din formular
    const userData = {
        real_name: document.getElementById("name").value.trim(),
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        description: document.getElementById("bio").value.trim(),
        birthdate: document.getElementById("birthdate").value,
        gender: document.getElementById("gender").value
    };

    try {

        const response = await fetch('../../backend/auth/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', result);

        if (response.ok && result.success) {
            showMessage("Account created successfully! Redirecting to login...", "success");

            // Redirect după 2 secunde
            setTimeout(() => {
                window.location.href = 'frontend/mainPage/index.html'; // pagina principala
            }, 2000);
        } else {
            (result.error || 'Registration failed. Please try again.', "error");
            //showMessage(`Error: ${JSON.stringify(result)}`, "error");
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
