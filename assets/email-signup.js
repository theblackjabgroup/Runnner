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

  // Original form functionality
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('error-state', 'empty');
  });

  form.addEventListener('submit', async (e) => {
    if (isSubmitting) return;

    const email = emailInput.value.trim();

    if (!email) {
      emailInput.classList.add('empty', 'error-state');
      emailInput.focus();
      return;
    }

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
    } catch (error) {
      buttonText.textContent = 'GET NOTIFIED';
      loadingSpinner.classList.add('hidden');
      emailInput.classList.add('error-state');
      submitButton.disabled = false;
    } finally {
      isSubmitting = false;
    }
  });
});
