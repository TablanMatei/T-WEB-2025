let currentStep = 1;

function nextStep() {
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

function submitForm() {
    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const bio = document.getElementById("bio").value;
    const birthdate = document.getElementById("birthdate").value;
    const gender = document.getElementById("gender").value;

    console.log({ name, username, email, password, bio, birthdate, gender });
    alert("Profile setup complete!");
}
