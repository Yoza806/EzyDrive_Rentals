/**
 * EzyDrive Rentals - Booking Page JavaScript
 * --------------------------------------------------------------
 * JavaScript handles buttons, tabs and form validation.
 * PHP handles login, database storage and booking availability.
 * All server requests go through backend/api.php (JSON API).
 */

document.addEventListener('DOMContentLoaded', async function () {
    // ==============================================================
    // 1. Shared page elements and current account information
    // ==============================================================
    const apiUrl = '../backend/api.php?action=';
    const tabs = {
        register: document.getElementById('registerTab'),
        login: document.getElementById('loginTab'),
        booking: document.getElementById('bookingTab'),
        details: document.getElementById('detailsTab'),
        manage: document.getElementById('manageTab')
    };
    const panels = {
        register: document.getElementById('register'),
        login: document.getElementById('login'),
        booking: document.getElementById('booking'),
        details: document.getElementById('details'),
        manage: document.getElementById('manage')
    };
    let currentUser = null;
    let csrfToken = '';
    let vehicles = [];
    let selectedVehicle = null;

    // Display feedback below a form (red for errors, green for success).
    function message(id, text, success = false) {
        const element = document.getElementById(id);
        element.textContent = text;
        element.classList.toggle('success', success);
    }

    // 2. Send GET/POST requests and read the JSON response.
    async function request(action, data = null) {
        const settings = { credentials: 'same-origin' };
        if (data !== null) {
            settings.method = 'POST';
            settings.headers = { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken };
            settings.body = JSON.stringify(data);
        }

        let response;
        try {
            response = await fetch(apiUrl + action, settings);
            const result = await response.json();
            if (!response.ok || !result.ok) throw new Error(result.message || 'Request failed.');
            return result;
        } catch (error) {
            throw new Error(error.message || 'Cannot connect to the server.');
        }
    }

    // 3. Switch between the page sections.
    function showSection(name) {
        Object.keys(tabs).forEach(function (key) {
            const active = key === name;
            panels[key].hidden = !active;
            tabs[key].classList.toggle('active', active);
            tabs[key].setAttribute('aria-selected', String(active));
        });
        if (name === 'details') loadBookings();
        if (name === 'manage' && currentUser && currentUser.role === 'admin') showManageVehicles();
    }

    Object.keys(tabs).forEach(function (name) {
        tabs[name].addEventListener('click', function () { showSection(name); });
    });
    document.getElementById('loginPromptButton').addEventListener('click', function () {
        showSection('login');
    });

    // ==============================================================
    // 4. Update user status and prefill booking contact details
    // ==============================================================
    function updateAccount() {
        const status = document.getElementById('accountStatus');
        const logout = document.getElementById('logoutButton');
        status.textContent = currentUser
            ? 'Signed in as ' + currentUser.full_name + ' (' + currentUser.role + ')'
            : 'Not signed in. Register or log in to book a vehicle.';
        logout.hidden = !currentUser;
        tabs.manage.hidden = !currentUser || currentUser.role !== 'admin';

        document.getElementById('customerName').value = currentUser ? currentUser.full_name : '';
        document.getElementById('customerPhone').value = currentUser ? currentUser.phone : '';
        updateBookingView();
    }

    // ==============================================================
    // 5. Register / login / logout (PHP manages password and sessions)
    // ==============================================================
    document.getElementById('registerForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmation = document.getElementById('confirmPassword').value;
        if (phone.replace(/\D/g, '').length < 9 || phone.replace(/\D/g, '').length > 15) {
            message('registerMessage', 'Phone number must have 9 to 15 digits.');
            return;
        }
        if (password !== confirmation) {
            message('registerMessage', 'Passwords do not match.');
            return;
        }
        try {
            const result = await request('register', {
                full_name: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: phone,
                password: password,
                confirm_password: confirmation
            });
            currentUser = result.user;
            this.reset();
            message('registerMessage', result.message, true);
            updateAccount();
            showSection(selectedVehicle ? 'booking' : 'details');
        } catch (error) {
            message('registerMessage', error.message);
        }
    });

    document.getElementById('loginForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
            const result = await request('login', {
                email: document.getElementById('loginEmail').value.trim(),
                password: document.getElementById('loginPassword').value
            });
            currentUser = result.user;
            this.reset();
            message('loginMessage', result.message, true);
            updateAccount();
            showSection(selectedVehicle ? 'booking' : 'details');
        } catch (error) {
            message('loginMessage', error.message);
        }
    });

    document.getElementById('logoutButton').addEventListener('click', async function () {
        try {
            const result = await request('logout', {});
            currentUser = null;
            csrfToken = result.csrf_token;
            updateAccount();
            showSection('login');
        } catch (error) {
            window.alert(error.message);
        }
    });

    // ==============================================================
    // 6. Load selected vehicle and calculate an estimated rental cost
    // ==============================================================
    const urlVehicle = new URLSearchParams(window.location.search).get('vehicle');
    const pickupDate = document.getElementById('pickupDate');
    const returnDate = document.getElementById('returnDate');
    const bookingForm = document.getElementById('bookingForm');
    const chooseVehicle = document.getElementById('chooseVehicle');
    const loginPrompt = document.getElementById('loginPrompt');
    const today = new Date();
    const todayText = today.getFullYear() + '-'
        + String(today.getMonth() + 1).padStart(2, '0') + '-'
        + String(today.getDate()).padStart(2, '0');
    pickupDate.min = todayText;
    returnDate.min = todayText;

    function updateBookingView() {
        chooseVehicle.hidden = !!selectedVehicle;
        loginPrompt.hidden = !selectedVehicle || !!currentUser;
        bookingForm.hidden = !selectedVehicle || !currentUser;
        if (selectedVehicle) {
            document.getElementById('selectedVehicle').textContent = selectedVehicle.name;
            document.getElementById('selectedPrice').textContent = '$' + selectedVehicle.price_per_day + ' per day';
            updateTotal();
        }
    }

    function rentalDays() {
        if (!pickupDate.value || !returnDate.value) return 0;
        const start = Date.parse(pickupDate.value + 'T00:00:00Z');
        const end = Date.parse(returnDate.value + 'T00:00:00Z');
        return Math.round((end - start) / 86400000);
    }

    function updateTotal() {
        const total = document.getElementById('bookingTotal');
        const days = rentalDays();
        if (!selectedVehicle || !pickupDate.value || !returnDate.value) {
            total.textContent = 'Select rental dates to see the estimated price.';
        } else if (pickupDate.value < todayText || days < 1 || days > 90) {
            total.textContent = 'Choose future dates with a rental length of 1 to 90 days.';
        } else {
            const cost = (days * Number(selectedVehicle.price_per_day)).toFixed(2);
            total.textContent = 'Estimated total: $' + cost + ' for ' + days + ' day(s).';
        }
    }

    pickupDate.addEventListener('change', function () {
        returnDate.min = pickupDate.value || todayText;
        updateTotal();
    });
    returnDate.addEventListener('change', updateTotal);

    bookingForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const days = rentalDays();
        if (!currentUser || !selectedVehicle) {
            message('bookingMessage', 'Log in and select a vehicle first.');
            return;
        }
        if (pickupDate.value < todayText || days < 1 || days > 90) {
            message('bookingMessage', 'Choose valid dates (1 to 90 days).');
            return;
        }
        try {
            await request('book', {
                vehicle_id: Number(selectedVehicle.id),
                pickup_date: pickupDate.value,
                return_date: returnDate.value
            });
            bookingForm.reset();
            updateTotal();
            message('bookingMessage', 'Vehicle booked successfully!', true);
            showSection('details');
        } catch (error) {
            message('bookingMessage', error.message);
        }
    });

    // ==============================================================
    // 7. Booking details and cancellation (from the MySQL bookings table)
    // ==============================================================
    async function loadBookings() {
        const list = document.getElementById('bookingList');
        list.replaceChildren();
        document.getElementById('detailsDescription').textContent =
            currentUser && currentUser.role === 'admin'
                ? 'View customer bookings and cancel a reservation.'
                : 'View and cancel your previous bookings.';

        if (!currentUser) {
            list.textContent = 'Please log in to see your bookings.';
            return;
        }
        try {
            const result = await request('bookings');
            if (!result.bookings.length) {
                list.textContent = 'No bookings yet. Select a vehicle to create one.';
                return;
            }
            result.bookings.forEach(function (booking) {
                // Use textContent so database values are displayed as text.
                const card = document.createElement('article');
                card.className = 'booking-list-card';
                const header = document.createElement('div');
                header.className = 'booking-list-header';
                const title = document.createElement('h3');
                title.textContent = booking.vehicle;
                const status = document.createElement('span');
                status.className = 'booking-status';
                status.textContent = booking.status;
                if (booking.status === 'Cancelled') status.classList.add('cancelled');
                header.append(title, status);
                card.appendChild(header);

                function addLine(label, value) {
                    const row = document.createElement('p');
                    row.textContent = label + ': ' + value;
                    card.appendChild(row);
                }
                addLine('Customer', booking.customer);
                addLine('Phone', booking.phone);
                addLine('Pickup', booking.pickup_date);
                addLine('Return', booking.return_date);
                addLine('Total', '$' + booking.total_price);

                const cancel = document.createElement('button');
                cancel.className = 'cancel-btn';
                cancel.type = 'button';
                cancel.textContent = booking.status === 'Cancelled' ? 'Cancelled' : 'Cancel Booking';
                cancel.disabled = booking.status === 'Cancelled';
                cancel.addEventListener('click', async function () {
                    if (!window.confirm('Cancel this booking for ' + booking.vehicle + '?')) return;
                    try {
                        await request('cancel', { booking_id: Number(booking.id) });
                        loadBookings();
                    } catch (error) {
                        window.alert(error.message);
                    }
                });
                card.appendChild(cancel);
                list.appendChild(card);
            });
        } catch (error) {
            list.textContent = error.message;
        }
    }

    // ==============================================================
    // 8. Admin vehicle manager: add, edit and delete vehicle records
    // ==============================================================
    function clearVehicleForm() {
        document.getElementById('vehicleForm').reset();
        document.getElementById('editVehicleId').value = '';
        message('vehicleMessage', '');
    }
    document.getElementById('clearVehicleButton').addEventListener('click', clearVehicleForm);

    function showManageVehicles() {
        const list = document.getElementById('manageVehicleList');
        list.replaceChildren();
        vehicles.forEach(function (vehicle) {
            const row = document.createElement('div');
            row.className = 'manage-row';
            const description = document.createElement('span');
            description.textContent = vehicle.name + ' — $' + vehicle.price_per_day
                + '/day' + (Number(vehicle.is_available) ? '' : ' (Unavailable)');
            const buttons = document.createElement('div');
            buttons.className = 'form-actions';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'cancel-btn';
            edit.textContent = 'Edit';
            edit.addEventListener('click', function () {
                document.getElementById('editVehicleId').value = vehicle.id;
                document.getElementById('vehicleName').value = vehicle.name;
                document.getElementById('vehicleCategory').value = vehicle.category;
                document.getElementById('vehicleTransmission').value = vehicle.transmission;
                document.getElementById('vehicleFuel').value = vehicle.fuel;
                document.getElementById('vehicleSeats').value = vehicle.seats;
                document.getElementById('vehiclePrice').value = vehicle.price_per_day;
                document.getElementById('vehicleImage').value = vehicle.image;
                document.getElementById('vehicleAvailable').checked = Number(vehicle.is_available) === 1;
                message('vehicleMessage', 'Editing ' + vehicle.name + '.', true);
                document.getElementById('vehicleForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'cancel-btn';
            remove.textContent = 'Delete';
            remove.addEventListener('click', async function () {
                if (!window.confirm('Delete ' + vehicle.name + '?')) return;
                try {
                    await request('delete_vehicle', { id: Number(vehicle.id) });
                    await refreshVehicles();
                    clearVehicleForm();
                    message('vehicleMessage', 'Vehicle deleted.', true);
                } catch (error) {
                    message('vehicleMessage', error.message);
                }
            });
            buttons.append(edit, remove);
            row.append(description, buttons);
            list.appendChild(row);
        });
    }

    document.getElementById('vehicleForm').addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
            await request('save_vehicle', {
                id: Number(document.getElementById('editVehicleId').value || 0),
                name: document.getElementById('vehicleName').value.trim(),
                category: document.getElementById('vehicleCategory').value.trim(),
                transmission: document.getElementById('vehicleTransmission').value,
                fuel: document.getElementById('vehicleFuel').value,
                seats: Number(document.getElementById('vehicleSeats').value),
                price_per_day: Number(document.getElementById('vehiclePrice').value),
                image: document.getElementById('vehicleImage').value,
                is_available: document.getElementById('vehicleAvailable').checked
            });
            clearVehicleForm();
            await refreshVehicles();
            message('vehicleMessage', 'Vehicle saved to the database.', true);
        } catch (error) {
            message('vehicleMessage', error.message);
        }
    });

    // 9. Refresh the catalog from the same database used by vehicles.php.
    async function refreshVehicles() {
        const result = await request('vehicles');
        vehicles = result.vehicles;
        selectedVehicle = vehicles.find(function (vehicle) {
            return String(vehicle.id) === urlVehicle || vehicle.name === urlVehicle;
        }) || null;
        updateBookingView();
        if (currentUser && currentUser.role === 'admin') showManageVehicles();
    }

    // ==============================================================
    // 10. Start page: fetch session & vehicles, then open correct tab.
    // ==============================================================
    try {
        const session = await request('me');
        csrfToken = session.csrf_token;
        currentUser = session.user;
        updateAccount();
        await refreshVehicles();
        if (window.location.hash === '#details') {
            showSection('details');
        } else if (urlVehicle || window.location.hash === '#booking') {
            showSection('booking');
        } else if (currentUser) {
            showSection('details');
        } else {
            showSection('register');
        }
    } catch (error) {
        document.getElementById('accountStatus').textContent =
            error.message + ' Check that Apache, MySQL and the database are running.';
    }
});
