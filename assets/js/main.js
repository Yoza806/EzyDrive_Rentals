/**
 * EzyDrive Rentals - Home Page Frontend Script
 * Pure Vanilla JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Header on Scroll
    const header = document.getElementById('mainHeader');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Navigation Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            const isOpen = navLinks.classList.contains('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            menuToggle.textContent = isOpen ? '✕' : '☰';
        });
    }

    // 3. Initialize Default Dates in Quick Search Form
    const pickupDateInput = document.getElementById('pickupDate');
    const returnDateInput = document.getElementById('returnDate');

    if (pickupDateInput && returnDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const threeDaysOut = new Date(today);
        threeDaysOut.setDate(today.getDate() + 3);

        const formatDate = (date) => date.toISOString().split('T')[0];

        pickupDateInput.min = formatDate(today);
        pickupDateInput.value = formatDate(tomorrow);

        returnDateInput.min = formatDate(tomorrow);
        returnDateInput.value = formatDate(threeDaysOut);

        pickupDateInput.addEventListener('change', () => {
            returnDateInput.min = pickupDateInput.value;
            if (returnDateInput.value < pickupDateInput.value) {
                returnDateInput.value = pickupDateInput.value;
            }
        });
    }

    // 4. Quick Booking Form Submission Handler
    const bookingForm = document.getElementById('quickBookingForm');
    const bookingFeedback = document.getElementById('bookingFeedback');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const location = document.getElementById('pickupLocation').value;
            const carType = document.getElementById('carType').value;
            const pickup = new Date(pickupDateInput.value);
            const dropoff = new Date(returnDateInput.value);

            const diffTime = dropoff - pickup;
            const rentalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            if (carType !== 'all') {
                filterVehiclesByCategory(carType);
            } else {
                filterVehiclesByCategory('all');
            }

            if (bookingFeedback) {
                bookingFeedback.style.display = 'block';
                bookingFeedback.textContent = `✓ Showing available ${carType === 'all' ? 'vehicles' : carType.toUpperCase() + 's'} in ${location} for ${rentalDays} day(s).`;
            }

            const fleetSection = document.getElementById('featured-fleet');
            if (fleetSection) {
                fleetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 5. Featured Fleet Category Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const vehicleCards = document.querySelectorAll('.vehicle-card');

    function filterVehiclesByCategory(category) {
        filterButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });

        vehicleCards.forEach((card) => {
            const cardCategory = card.dataset.category;
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedFilter = button.dataset.filter;
            filterVehiclesByCategory(selectedFilter);
        });
    });

    // 6. Quick Reserve Modal Logic
    const modal = document.getElementById('bookingModal');
    const modalCarName = document.getElementById('modalCarName');
    const modalCarPrice = document.getElementById('modalCarPrice');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const bookButtons = document.querySelectorAll('.js-book-car');

    bookButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const carName = btn.dataset.car;
            const carPrice = btn.dataset.price;

            if (modalCarName && modalCarPrice && modal) {
                modalCarName.textContent = carName;
                modalCarPrice.textContent = `$${carPrice}/day`;
                modal.classList.add('active');
            }
        });
    });

    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
});
