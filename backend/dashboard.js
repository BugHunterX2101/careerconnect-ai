document.addEventListener('DOMContentLoaded', function() {
    // Get all main sections
    const dashboardSection = document.querySelector('.quick-stats').parentElement;
    const formSection = document.querySelector('.form-section');
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.side-nav a');
    
    // Hide all sections except dashboard initially
    formSection.style.display = 'none';
    dashboardSection.style.display = 'block';

    // Add click event listeners to all nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Hide all sections
            dashboardSection.style.display = 'none';
            formSection.style.display = 'none';
            
            // Show appropriate section based on href
            if (link.getAttribute('href') === '#form') {
                formSection.style.display = 'block';
            } else if (link.getAttribute('href') === '#dashboard') {
                dashboardSection.style.display = 'block';
            }
        });
    });

    // Add Education Fields functionality
    const addEducationBtn = document.querySelector('.add-education-btn');
    const educationFields = document.querySelector('.education-fields');

    if (addEducationBtn && educationFields) {
        addEducationBtn.addEventListener('click', () => {
            const newEducation = educationFields.firstElementChild.cloneNode(true);
            // Clear input values
            newEducation.querySelectorAll('input').forEach(input => input.value = '');
            educationFields.appendChild(newEducation);
        });
    }

    // Smooth scroll functionality
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const section = document.querySelector(this.getAttribute('href'));
            if (section) {
                section.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active section highlighting
    const sections = document.querySelectorAll('.scroll-section');
    const navLinks = document.querySelectorAll('.side-nav a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - sectionHeight / 3) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}); 