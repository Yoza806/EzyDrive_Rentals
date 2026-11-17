<?php
/**
 * Vehicles Page
 * Reads the catalog from MySQL, then displays one card per vehicle.
 * The Book Now link passes the database vehicle ID to booking.php.
 */
require_once __DIR__ . '/../backend/db.php';

$vehicles = [];
$loadError = '';
try {
    $vehicles = db()->query('SELECT * FROM vehicles WHERE is_available = 1 ORDER BY id')->fetchAll();
} catch (PDOException $error) {
    error_log('Vehicle page: ' . $error->getMessage());
    $loadError = 'Could not load vehicles. Start MySQL and import database/ezydrive_rentals.sql.';
}

// Convert database text into safe HTML output.
function escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EzyDrive Rentals | Vehicles</title>
    <meta name="description" content="Browse our rental vehicles at EzyDrive Rentals.">
    <link rel="stylesheet" href="../styles/style.css">
</head>
<body>
    <!-- 1. Shared header and navbar -->
    <header class="header" id="mainHeader">
        <div class="container navbar">
            <a href="../index.html" class="logo"><div class="logo-icon">🚘</div>Ezy<span>Drive</span></a>
            <nav aria-label="Main navigation">
                <ul class="nav-links" id="navLinks">
                    <li><a href="../index.html" class="nav-link">Home</a></li>
                    <li><a href="vehicles.php" class="nav-link active" aria-current="page">Vehicles</a></li>
                    <li><a href="booking.php" class="nav-link">Booking</a></li>
                    <li><a href="about.html" class="nav-link">About Us</a></li>
                </ul>
            </nav>
            <div class="nav-actions">
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu" aria-expanded="false">☰</button>
            </div>
        </div>
    </header>

    <!-- 2. Page title -->
    <main class="page-banner">
        <div class="container page-banner-content">
            <h1>Choose The Right Vehicle For Your Next Trip</h1>
        </div>
    </main>

    <!-- 3. Database-driven vehicle cards -->
    <section class="vehicle-section">
        <div class="container">
            <div class="section-heading"><p>Available Vehicles</p></div>

            <?php if ($loadError): ?>
                <p class="booking-note"><?= escape($loadError) ?></p>
            <?php elseif (!$vehicles): ?>
                <p class="booking-note">No vehicles available at the moment.</p>
            <?php endif; ?>

            <div class="vehicle-grid">
                <?php foreach ($vehicles as $vehicle): ?>
                    <!-- Each card uses one row from the vehicles table -->
                    <article class="vehicle-card">
                        <img src="../assets/images/vehicles/<?= escape($vehicle['image']) ?>"
                             alt="<?= escape($vehicle['name']) ?> rental vehicle" loading="lazy">
                        <div class="vehicle-card-body">
                            <div class="vehicle-card-top">
                                <div>
                                    <span class="vehicle-tag"><?= escape($vehicle['category']) ?></span>
                                    <h3><?= escape($vehicle['name']) ?></h3>
                                </div>
                                <div class="vehicle-price">$<?= number_format((float) $vehicle['price_per_day'], 0) ?><span>/day</span></div>
                            </div>
                            <ul class="vehicle-features">
                                <li>Transmission: <?= escape($vehicle['transmission']) ?></li>
                                <li>Fuel: <?= escape($vehicle['fuel']) ?></li>
                                <li>Seats: <?= (int) $vehicle['seats'] ?></li>
                            </ul>
                            <a href="booking.php?vehicle=<?= (int) $vehicle['id'] ?>#booking"
                               class="btn btn-primary small-btn">Book Now</a>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- 4. Shared footer and mobile navbar script -->
    <footer class="footer">
        <div class="container footer-bottom"><p>&copy; 2026 EzyDrive Rentals. All rights reserved.</p></div>
    </footer>
    <script src="../scripts/main.js"></script>
</body>
</html>
