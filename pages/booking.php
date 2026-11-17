<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzyDrive Rentals | Booking</title>
    <meta name="description" content="Register, log in, book vehicles and manage rental bookings at EzyDrive Rentals.">

    <!-- Shared design first, followed by Booking page styles. -->
    <link rel="stylesheet" href="../styles/style.css">
    <link rel="stylesheet" href="../styles/booking.css">
</head>
<body>
    <!-- ===========================================================
         1. HEADER & NAVIGATION - Same as the other pages
         =========================================================== -->
    <header class="header" id="mainHeader">
        <div class="container navbar">
            <a href="../index.html" class="logo"><div class="logo-icon">🚘</div>Ezy<span>Drive</span></a>
            <nav aria-label="Main navigation">
                <ul class="nav-links" id="navLinks">
                    <li><a href="../index.html" class="nav-link">Home</a></li>
                    <li><a href="vehicles.php" class="nav-link">Vehicles</a></li>
                    <li><a href="booking.php" class="nav-link active" aria-current="page">Booking</a></li>
                    <li><a href="about.html" class="nav-link">About Us</a></li>
                </ul>
            </nav>
            <div class="nav-actions">
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu" aria-expanded="false">☰</button>
            </div>
        </div>
    </header>

    <main>
        <!-- =======================================================
             2. BANNER - Matches the site's navy / red theme
             ======================================================= -->
        <section class="page-banner booking-banner">
            <div class="container page-banner-content">
                <h1>Register &amp; <span class="booking-accent">Book</span></h1>
                <p>Create an account, choose a vehicle, or review your bookings.</p>
            </div>
        </section>

        <section class="booking-section">
            <div class="container booking-container">
                <!-- ===================================================
                     3. ACCOUNT STATUS - Updated after PHP session check
                     =================================================== -->
                <div class="account-bar">
                    <span id="accountStatus">Checking account...</span>
                    <button class="cancel-btn" type="button" id="logoutButton" hidden>Log Out</button>
                </div>

                <!-- ===================================================
                     4. TABS - One panel visible at a time
                     =================================================== -->
                <div class="booking-tabs" aria-label="Booking page sections">
                    <button type="button" class="booking-tab active" id="registerTab">Register User</button>
                    <button type="button" class="booking-tab" id="loginTab">Log In</button>
                    <button type="button" class="booking-tab" id="bookingTab">Book a Vehicle</button>
                    <button type="button" class="booking-tab" id="detailsTab">Booking Details</button>
                    <button type="button" class="booking-tab" id="manageTab" hidden>Manage Vehicles</button>
                </div>

                <!-- ===================================================
                     5. REGISTER - Saved to users table by backend/api.php
                     =================================================== -->
                <section class="booking-panel" id="register">
                    <h2>Create a Customer Account</h2>
                    <p class="booking-description">Enter your details to register and sign in.</p>
                    <form id="registerForm">
                        <div class="booking-form-grid">
                            <div class="form-field">
                                <label for="fullName">Full Name</label>
                                <input type="text" id="fullName" autocomplete="name" maxlength="100" required>
                            </div>
                            <div class="form-field">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" autocomplete="email" maxlength="190" required>
                            </div>
                            <div class="form-field">
                                <label for="phone">Phone Number</label>
                                <input type="tel" id="phone" autocomplete="tel" maxlength="20" placeholder="07XXXXXXXX" required>
                            </div>
                            <div class="form-field">
                                <label for="password">Password</label>
                                <input type="password" id="password" autocomplete="new-password" minlength="8" required>
                            </div>
                            <div class="form-field">
                                <label for="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" autocomplete="new-password" minlength="8" required>
                            </div>
                        </div>
                        <button class="btn btn-primary" type="submit">Register User</button>
                        <p class="form-message" id="registerMessage" aria-live="polite"></p>
                    </form>
                </section>

                <!-- ===================================================
                     6. LOGIN - Verifies password and starts PHP session
                     =================================================== -->
                <section class="booking-panel" id="login" hidden>
                    <h2>Log In</h2>
                    <p class="booking-description">Sign in to make or manage your bookings.</p>
                    <form id="loginForm">
                        <div class="booking-form-grid">
                            <div class="form-field">
                                <label for="loginEmail">Email Address</label>
                                <input type="email" id="loginEmail" autocomplete="email" required>
                            </div>
                            <div class="form-field">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" autocomplete="current-password" required>
                            </div>
                        </div>
                        <button class="btn btn-primary" type="submit">Log In</button>
                        <p class="form-message" id="loginMessage" aria-live="polite"></p>
                    </form>
                </section>

                <!-- ===================================================
                     7. BOOK A VEHICLE - PHP checks dates and total cost
                     =================================================== -->
                <section class="booking-panel" id="booking" hidden>
                    <h2>Book a Vehicle</h2>
                    <p class="booking-description">Choose the rental dates for your vehicle.</p>

                    <div id="chooseVehicle" hidden>
                        <p class="booking-description">You haven't selected a vehicle yet.</p>
                        <a href="vehicles.php" class="btn btn-primary">Browse Vehicles &rarr;</a>
                    </div>
                    <div id="loginPrompt" hidden>
                        <p class="booking-description">Please log in or register before booking this vehicle.</p>
                        <button type="button" class="btn btn-primary" id="loginPromptButton">Log In</button>
                    </div>
                    <form id="bookingForm" hidden>
                        <div class="selected-vehicle">
                            <div>
                                <span class="selected-label">Selected Vehicle</span>
                                <h3 id="selectedVehicle">Vehicle Name</h3>
                                <p id="selectedPrice">Daily rental price</p>
                            </div>
                            <a href="vehicles.php" class="change-vehicle">Change Vehicle</a>
                        </div>
                        <div class="booking-form-grid">
                            <div class="form-field">
                                <label for="customerName">Customer Name (account)</label>
                                <input type="text" id="customerName" readonly>
                            </div>
                            <div class="form-field">
                                <label for="customerPhone">Phone Number (account)</label>
                                <input type="tel" id="customerPhone" readonly>
                            </div>
                            <div class="form-field">
                                <label for="pickupDate">Pickup Date</label>
                                <input type="date" id="pickupDate" required>
                            </div>
                            <div class="form-field">
                                <label for="returnDate">Return Date</label>
                                <input type="date" id="returnDate" required>
                            </div>
                        </div>
                        <div class="booking-total" id="bookingTotal" aria-live="polite">
                            Select rental dates to see the estimated price.
                        </div>
                        <button type="submit" class="btn btn-primary">Book Vehicle</button>
                        <p class="form-message" id="bookingMessage" aria-live="polite"></p>
                    </form>
                </section>

                <!-- ===================================================
                     8. BOOKING DETAILS - Loaded from MySQL, with cancel
                     =================================================== -->
                <section class="booking-panel" id="details" hidden>
                    <h2>Booking Details</h2>
                    <p class="booking-description" id="detailsDescription">View and cancel your previous bookings.</p>
                    <div id="bookingList" aria-live="polite"></div>
                </section>

                <!-- ===================================================
                     9. ADMIN VEHICLE CRUD - Only shown to admin users
                     =================================================== -->
                <section class="booking-panel" id="manage" hidden>
                    <h2>Manage Vehicles</h2>
                    <p class="booking-description">Add a vehicle or select one below to edit or delete it.</p>
                    <form id="vehicleForm">
                        <input type="hidden" id="editVehicleId">
                        <div class="booking-form-grid">
                            <div class="form-field">
                                <label for="vehicleName">Vehicle Name</label>
                                <input type="text" id="vehicleName" maxlength="100" required>
                            </div>
                            <div class="form-field">
                                <label for="vehicleCategory">Category</label>
                                <input type="text" id="vehicleCategory" maxlength="40" placeholder="Sedan, SUV..." required>
                            </div>
                            <div class="form-field">
                                <label for="vehicleTransmission">Transmission</label>
                                <select id="vehicleTransmission"><option>Automatic</option><option>Manual</option></select>
                            </div>
                            <div class="form-field">
                                <label for="vehicleFuel">Fuel</label>
                                <select id="vehicleFuel"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select>
                            </div>
                            <div class="form-field">
                                <label for="vehicleSeats">Seats</label>
                                <input type="number" id="vehicleSeats" min="1" max="20" value="5" required>
                            </div>
                            <div class="form-field">
                                <label for="vehiclePrice">Price Per Day ($)</label>
                                <input type="number" id="vehiclePrice" min="1" step="0.01" required>
                            </div>
                            <div class="form-field">
                                <label for="vehicleImage">Vehicle Image</label>
                                <select id="vehicleImage">
                                    <option value="sedan-silver.png">Silver Sedan</option>
                                    <option value="suv-white.png">White SUV</option>
                                    <option value="hatchback-red.png">Red Hatchback</option>
                                    <option value="sedan-black.png">Black Sedan</option>
                                    <option value="crossover-blue.png">Blue Crossover</option>
                                    <option value="pickup-gray.png">Gray Pickup</option>
                                </select>
                            </div>
                            <div class="form-field available-field">
                                <label><input type="checkbox" id="vehicleAvailable" checked> Available to rent</label>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Save Vehicle</button>
                            <button type="button" class="btn btn-outline" id="clearVehicleButton">Clear Form</button>
                        </div>
                        <p class="form-message" id="vehicleMessage" aria-live="polite"></p>
                    </form>
                    <div id="manageVehicleList" class="manage-list"></div>
                </section>
            </div>
        </section>
    </main>

    <!-- 10. Shared footer + two small JavaScript files -->
    <footer class="footer"><div class="container footer-bottom">
        <p>&copy; 2026 EzyDrive Rentals. All rights reserved.</p>
    </div></footer>
    <script src="../scripts/main.js"></script>
    <script src="../scripts/booking.js"></script>
</body>
</html>
