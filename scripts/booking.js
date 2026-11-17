/* =====================================================================
   EzyDrive Rentals - Booking Page JavaScript
   Frontend demonstration. Bookings use localStorage, not PHP/MySQL.
   Registration is only validated; no passwords or accounts are saved.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    // 1. Sample rental prices (same vehicles as vehicles.html).
    const vehiclePrices = {
        'Toyota Corolla': 48,
        'Nissan X-Trail': 74,
        'Suzuki Swift': 39,
        'BMW 3 Series': 95,
        'Tesla Model 3': 88,
        'Toyota Hilux': 82,
        'Honda Civic': 52,
        'Hyundai Tucson': 70,
        'Kia Picanto': 34,
        'Mercedes C-Class': 105,
        'Honda Vezel': 69,
        'Ford Ranger': 86
    };

    // 2. Tabs: show one of the three sections at a time.
    const tabs = {
        register: document.getElementById('registerTab'),
        booking: document.getElementById('bookingTab'),
        details: document.getElementById('detailsTab')
    };
    const panels = {
        register: document.getElementById('register'),
        booking: document.getElementById('booking'),
        details: document.getElementById('details')
    };

    function showSection(section) {
        Object.keys(tabs).forEach(function (name) {
            const selected = name === section;
            tabs[name].classList.toggle('active', selected);
            tabs[name].setAttribute('aria-selected', String(selected));
            panels[name].hidden = !selected;
        });
        if (section === 'details') {
            showBookings();
        }
    }

    tabs.register.addEventListener('click', function () { showSection('register'); });
    tabs.booking.addEventListener('click', function () { showSection('booking'); });
    tabs.details.addEventListener('click', function () { showSection('details'); });

    // 3. Validate registration only. Passwords are never stored here.
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const phone = document.getElementById('phone').value.replace(/\D/g, '');
        const password = document.getElementById('password').value;
        const confirmation = document.getElementById('confirmPassword').value;
        registerMessage.classList.remove('success');

        if (phone.length < 9 || phone.length > 15) {
            registerMessage.textContent = 'Please enter a valid phone number (9 to 15 digits).';
        } else if (password !== confirmation) {
            registerMessage.textContent = 'Passwords do not match.';
        } else {
            registerMessage.classList.add('success');
            registerMessage.textContent = 'Form is valid! Accounts will be saved when the backend is added.';
            registerForm.reset();
        }
    });

    // 4. Load the vehicle selected on vehicles.html through the URL.
    //    Example: booking.html?vehicle=Toyota%20Corolla#booking
    const params = new URLSearchParams(window.location.search);
    const vehicleName = params.get('vehicle');
    const hasVehicle = Object.prototype.hasOwnProperty.call(vehiclePrices, vehicleName);
    const chooseVehicle = document.getElementById('chooseVehicle');
    const bookingForm = document.getElementById('bookingForm');
    const pickupDate = document.getElementById('pickupDate');
    const returnDate = document.getElementById('returnDate');
    const bookingTotal = document.getElementById('bookingTotal');
    const bookingMessage = document.getElementById('bookingMessage');

    if (hasVehicle) {
        chooseVehicle.hidden = true;
        bookingForm.hidden = false;
        document.getElementById('selectedVehicle').textContent = vehicleName;
        document.getElementById('selectedPrice').textContent = '$' + vehiclePrices[vehicleName] + ' per day';
    }

    // 5. Keep dates valid and calculate the rental cost.
    const today = new Date();
    const todayText = today.getFullYear() + '-'
        + String(today.getMonth() + 1).padStart(2, '0') + '-'
        + String(today.getDate()).padStart(2, '0');
    pickupDate.min = todayText;
    returnDate.min = todayText;

    function rentalDays() {
        return Math.round((new Date(returnDate.value) - new Date(pickupDate.value)) / 86400000);
    }

    function updateTotal() {
        bookingMessage.textContent = '';
        if (!pickupDate.value || !returnDate.value) {
            bookingTotal.textContent = 'Select the rental dates to see the estimated price.';
            return;
        }
        if (rentalDays() <= 0 || pickupDate.value < todayText) {
            bookingTotal.textContent = 'Return date must be later than pickup date. Pickup cannot be in the past.';
            return;
        }
        bookingTotal.textContent = 'Estimated total: $' + (rentalDays() * vehiclePrices[vehicleName])
            + ' for ' + rentalDays() + ' day(s).';
    }

    pickupDate.addEventListener('change', function () {
        returnDate.min = pickupDate.value || todayText;
        updateTotal();
    });
    returnDate.addEventListener('change', updateTotal);

    // 6. Read and write demo bookings in this browser only.
    //    This is temporary. PHP/MySQL will later replace localStorage.
    const storageKey = 'ezydrive_demo_bookings';

    function getBookings() {
        try {
            const result = JSON.parse(localStorage.getItem(storageKey) || '[]');
            return Array.isArray(result) ? result : [];
        } catch (error) {
            return [];
        }
    }

    function saveBookings(bookings) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(bookings));
            return true;
        } catch (error) {
            return false;
        }
    }

    // 7. A valid booking is added to localStorage and Booking Details opens.
    bookingForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const customer = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.replace(/\D/g, '');
        bookingMessage.classList.remove('success');

        if (!hasVehicle) {
            bookingMessage.textContent = 'Please choose a vehicle first.';
        } else if (!customer) {
            bookingMessage.textContent = 'Please enter a customer name.';
        } else if (phone.length < 9 || phone.length > 15) {
            bookingMessage.textContent = 'Please enter a valid phone number (9 to 15 digits).';
        } else if (!pickupDate.value || !returnDate.value || rentalDays() <= 0 || pickupDate.value < todayText) {
            bookingMessage.textContent = 'Please choose valid rental dates.';
        } else {
            const bookings = getBookings();
            bookings.push({
                id: String(Date.now()),
                customer: customer,
                phone: phone,
                vehicle: vehicleName,
                pickup: pickupDate.value,
                returning: returnDate.value,
                total: rentalDays() * vehiclePrices[vehicleName],
                status: 'Booked'
            });

            if (!saveBookings(bookings)) {
                bookingMessage.textContent = 'Could not save the demo booking in this browser.';
                return;
            }
            bookingForm.reset();
            bookingTotal.textContent = 'Select the rental dates to see the estimated price.';
            showSection('details');
        }
    });

    // 8. Create a readable card for every booking.
    //    textContent displays customer data safely as plain text.
    const bookingList = document.getElementById('bookingList');

    function showBookings() {
        const bookings = getBookings();
        bookingList.replaceChildren();

        if (bookings.length === 0) {
            const message = document.createElement('p');
            message.className = 'empty-bookings';
            message.textContent = 'No bookings yet. Choose a vehicle to create your first booking.';
            bookingList.appendChild(message);
            return;
        }

        bookings.slice().reverse().forEach(function (booking) {
            const card = document.createElement('article');
            card.className = 'booking-list-card';

            const header = document.createElement('div');
            header.className = 'booking-list-header';

            const vehicle = document.createElement('h3');
            vehicle.textContent = booking.vehicle;
            header.appendChild(vehicle);

            const status = document.createElement('span');
            status.className = 'booking-status';
            if (booking.status === 'Cancelled') status.classList.add('cancelled');
            status.textContent = booking.status;
            header.appendChild(status);
            card.appendChild(header);

            // Small helper: creates one labelled line of booking information.
            function addDetail(label, value) {
                const line = document.createElement('p');
                line.textContent = label + ': ' + value;
                card.appendChild(line);
            }

            addDetail('Customer', booking.customer);
            addDetail('Phone', booking.phone);
            addDetail('Pickup', booking.pickup);
            addDetail('Return', booking.returning);
            addDetail('Total', '$' + booking.total);

            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'cancel-btn';
            cancelButton.textContent = booking.status === 'Cancelled' ? 'Cancelled' : 'Cancel Booking';
            cancelButton.disabled = booking.status === 'Cancelled';

            // Cancel changes the status; it does not delete the record.
            cancelButton.addEventListener('click', function () {
                if (!window.confirm('Cancel the booking for ' + booking.vehicle + '?')) return;
                const updated = getBookings();
                const selected = updated.find(function (item) { return item.id === booking.id; });
                if (selected && selected.status !== 'Cancelled') {
                    selected.status = 'Cancelled';
                    if (saveBookings(updated)) {
                        showBookings();
                    } else {
                        window.alert('Could not save the cancellation in this browser.');
                    }
                }
            });

            card.appendChild(cancelButton);
            bookingList.appendChild(card);
        });
    }

    // 9. Open the correct section on first load.
    //    Clicking Book Now in Vehicles opens Booking automatically.
    if (window.location.hash === '#details') {
        showSection('details');
    } else if (hasVehicle || window.location.hash === '#booking') {
        showSection('booking');
    } else {
        showSection('register');
    }
});
