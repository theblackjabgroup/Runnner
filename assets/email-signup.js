document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('email-signup-form-password');
  const emailInput = document.getElementById('email-input-password');
  const submitButton = document.getElementById('submitButton-password');
  const buttonText = document.getElementById('buttonText-password');
  const loadingSpinner = document.getElementById('loadingSpinner-password');
  const successMessage = document.getElementById('successMessage-password');
  const passwordModal = document.getElementById('passwordModal');
  const enterPasswordBtn = document.getElementById('enterPasswordBtn');
  const mainContainer = document.getElementById('mainContainer-password');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const emailError = document.getElementById('email-error-password');

  if (!form) return;

  let isSubmitting = false;

  // Password modal functionality
  enterPasswordBtn.onclick = function () {
    passwordModal.classList.remove('hidden');
    mainContainer.style.display = 'none';
  };

  closeModalBtn.onclick = function () {
    passwordModal.classList.add('hidden');
    mainContainer.style.display = 'flex';
  };

  // Email validation functionality
  function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
      emailError.textContent = 'Email is required';
      emailError.classList.remove('hidden');
      emailInput.classList.add('border-red-500');
      return false;
    }

    if (!emailRegex.test(email)) {
      emailError.textContent = 'Please enter a valid email address';
      emailError.classList.remove('hidden');
      emailInput.classList.add('border-red-500');
      return false;
    }

    emailError.classList.add('hidden');
    emailInput.classList.remove('border-red-500');
    return true;
  }

  // Real-time validation
  emailInput.addEventListener('input', function () {
    validateEmail();
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateEmail() || isSubmitting) return;

    const email = emailInput.value.trim();
    isSubmitting = true;
    buttonText.textContent = 'SUBMITTING...';
    loadingSpinner.classList.remove('hidden');
    submitButton.disabled = true;

    try {
      // Simulate submission delay (e.g., API call)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      successMessage.classList.remove('hidden');
      buttonText.textContent = 'SUBSCRIBED';
      loadingSpinner.classList.add('hidden');
      emailInput.disabled = true;
      submitButton.disabled = true;

      await new Promise((resolve) => setTimeout(resolve, 9000));

    } catch (error) {
      buttonText.textContent = 'SUBSCRIBE';
      loadingSpinner.classList.add('hidden');
      emailInput.classList.add('border-red-500');
      emailError.textContent = 'An error occurred. Please try again.';
      emailError.classList.remove('hidden');
      submitButton.disabled = false;
    } finally {
      isSubmitting = false;
    }
  });
});
