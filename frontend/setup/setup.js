function nextStep() {
    document.getElementById("step-1-content").style.display = "none";
    document.getElementById("step-2-content").style.display = "block";
    document.getElementById("step-1").classList.remove("active");
    document.getElementById("step-2").classList.add("active");
}

function prevStep() {
    document.getElementById("step-2-content").style.display = "none";
    document.getElementById("step-1-content").style.display = "block";
    document.getElementById("step-2").classList.remove("active");
    document.getElementById("step-1").classList.add("active");
}

function submitForm() {
    alert("Profile setup complete!");
}
function updateStepIndicator(currentStep) {
  const steps = document.querySelectorAll('.step-bar');
  steps.forEach((step, index) => {
    step.classList.remove('completed', 'active');
    if(index < currentStep - 1) {
      step.classList.add('completed');
    } else if(index === currentStep - 1) {
      step.classList.add('active');
    }
  });
}
