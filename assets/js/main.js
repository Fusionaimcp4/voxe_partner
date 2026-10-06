document.addEventListener('DOMContentLoaded', function() {

  // Smooth scroll for navigation links
  const navLinks = document.querySelectorAll('header nav ul li a[href^="#"]');

  navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault(); // Prevent default anchor jump

          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);

          if (targetElement) {
              // Calculate position, considering the sticky header height
              const headerOffset = document.querySelector('header').offsetHeight;
              const elementPosition = targetElement.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

              window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth'
              });

              // Optional: Close mobile menu if one exists and is open
              // Example: document.querySelector('.mobile-menu')?.classList.remove('active');
          }
      });
  });

  // Update footer year
  const currentYearSpan = document.getElementById('current-year');
  if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear();
  }

  // Optional: Add active state to nav link on scroll (more complex)
  // This requires tracking scroll position relative to sections.
  // Can be added later if needed.

});