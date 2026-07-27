/* ═══════════════════════════════════════════════════════════════════
   SIELSOORD — Contact Form Handler
   Validation + submission (Formspree or Netlify Forms compatible)
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const t = (key) => {
    const lang = localStorage.getItem('sielsoord-lang') || 'af';
    return window.TRANSLATIONS?.[lang]?.[key]
      || window.TRANSLATIONS?.af?.[key]
      || key;
  };

  // Auto-fill koppie field from URL param (?koppie=sielskemering)
  const params = new URLSearchParams(window.location.search);
  const koppie = params.get('koppie') || params.get('berg');  // backward compat
  if (koppie) {
    const select = form.querySelector('[name="mountain"]') || form.querySelector('[name="koppie"]');
    if (select) {
      // Try exact match, then partial
      for (const option of select.options) {
        if (option.value.toLowerCase() === koppie.toLowerCase() ||
            option.text.toLowerCase().includes(koppie.toLowerCase())) {
          select.value = option.value;
          break;
        }
      }
    }
  }

  /* Validation */
  function showError(field, message) {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    const input = form.querySelector(`[name="${field}"]`);
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function clearError(field) {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
    const input = form.querySelector(`[name="${field}"]`);
    if (input) input.removeAttribute('aria-invalid');
  }

  function validate() {
    let valid = true;

    const name = form.querySelector('[name="name"]').value.trim();
    if (!name || name.length < 2) {
      showError('name', t('kontak.error_name'));
      valid = false;
    } else clearError('name');

    const email = form.querySelector('[name="email"]').value.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      showError('email', t('kontak.error_email'));
      valid = false;
    } else clearError('email');

    const phone = form.querySelector('[name="phone"]').value.trim();
    if (phone && phone.replace(/\D/g, '').length < 8) {
      showError('phone', t('kontak.error_phone'));
      valid = false;
    } else clearError('phone');

    const message = form.querySelector('[name="message"]').value.trim();
    if (!message || message.length < 5) {
      showError('message', t('kontak.error_message'));
      valid = false;
    } else clearError('message');

    return valid;
  }

  /* Submit */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = t('kontak.sending');
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);

      // === For Formspree ===
      // Replace 'YOUR_FORM_ID' with your actual Formspree form ID
      // const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      //   method: 'POST',
      //   body: formData,
      //   headers: { Accept: 'application/json' }
      // });

      // === For Netlify Forms ===
      // Netlify handles forms automatically if the form has data-netlify="true"
      // and a hidden form-name field. Just submit normally:
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      if (response.ok) {
        form.reset();
        const success = document.querySelector('.form-success');
        if (success) {
          success.classList.add('visible');
          success.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      // Fallback: show a message to contact directly
      alert(t('kontak.submit_error'));
    }

    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  });

  // Clear errors on input
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('input', () => {
      clearError(input.name);
    });
  });
});
