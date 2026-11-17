<?php
/**
 * EzyDrive Rentals - JSON API
 * --------------------------------------------------------------
 * GET actions:  me, vehicles, bookings
 * POST actions: register, login, logout, book, cancel,
 *               save_vehicle, delete_vehicle
 * All database operations happen here, not in JavaScript.
 */

declare(strict_types=1);
require_once __DIR__ . '/db.php';

// 1. Initialize session and JSON response settings.
date_default_timezone_set('Asia/Colombo');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
}

// 2. Small helpers for consistent JSON responses and validation.
final class ApiError extends Exception
{
    public function __construct(string $message, public int $httpStatus = 400)
    {
        parent::__construct($message);
    }
}

function reply(array $result, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($result, JSON_UNESCAPED_SLASHES);
    exit;
}

function bad(string $message, int $status = 400): never
{
    throw new ApiError($message, $status);
}

function input(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : $_POST;
}

function value(array $data, string $key): string
{
    return trim((string) ($data[$key] ?? ''));
}

function getUser(PDO $pdo): ?array
{
    $id = (int) ($_SESSION['user_id'] ?? 0);
    if ($id < 1) return null;
    $stmt = $pdo->prepare('SELECT id, full_name, email, phone, role FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function requireUser(?array $user): array
{
    if (!$user) bad('Please log in to continue.', 401);
    return $user;
}

function requireAdmin(?array $user): void
{
    if (!$user || $user['role'] !== 'admin') bad('Admin access required.', 403);
}

function parseRentalDate(string $date): DateTimeImmutable
{
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) bad('Please select a valid date.');
    return $parsed;
}

function phoneValid(string $phone): bool
{
    $digits = preg_replace('/\D/', '', $phone);
    return strlen($digits) >= 9 && strlen($digits) <= 15;
}

// 3. Route the request to the requested operation.
try {
    $pdo = db();
    $action = (string) ($_GET['action'] ?? '');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $user = getUser($pdo);

    // Public GET requests (or restricted booking history).
    if ($method === 'GET') {
        if ($action === 'me') {
            reply(['ok' => true, 'user' => $user, 'csrf_token' => $_SESSION['csrf_token']]);
        }
        if ($action === 'vehicles') {
            $vehicles = $pdo->query('SELECT * FROM vehicles ORDER BY id')->fetchAll();
            reply(['ok' => true, 'vehicles' => $vehicles]);
        }
        if ($action === 'bookings') {
            $user = requireUser($user);
            $sql = 'SELECT b.id, b.pickup_date, b.return_date, b.total_price, b.status,
                           v.name AS vehicle, u.full_name AS customer, u.phone
                    FROM bookings b
                    JOIN vehicles v ON b.vehicle_id = v.id
                    JOIN users u ON b.user_id = u.id';
            if ($user['role'] !== 'admin') {
                $sql .= ' WHERE b.user_id = ?';
            }
            $sql .= ' ORDER BY b.id DESC';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($user['role'] === 'admin' ? [] : [(int) $user['id']]);
            reply(['ok' => true, 'bookings' => $stmt->fetchAll()]);
        }
        bad('Unknown request.', 404);
    }

    if ($method !== 'POST') bad('Method not allowed.', 405);

    // CSRF prevents another site from submitting requests as this user.
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $token)) bad('Session expired. Refresh the page.', 403);
    $data = input();

    // 4. Create a new user account.
    if ($action === 'register') {
        $name = value($data, 'full_name');
        $email = strtolower(value($data, 'email'));
        $phone = value($data, 'phone');
        $password = (string) ($data['password'] ?? '');
        if (strlen($name) < 2 || strlen($name) > 100) bad('Enter a name between 2 and 100 characters.');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) bad('Enter a valid email.');
        if (!phoneValid($phone) || strlen($phone) > 20) bad('Enter a valid phone number.');
        if (strlen($password) < 8) bad('Password must be at least 8 characters.');
        if ($password !== (string) ($data['confirm_password'] ?? '')) bad('Passwords do not match.');

        $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $check->execute([$email]);
        if ($check->fetch()) bad('This email is already registered.', 409);

        $stmt = $pdo->prepare('INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT)]);
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $pdo->lastInsertId();
        reply(['ok' => true, 'message' => 'Registration successful!', 'user' => getUser($pdo)], 201);
    }

    // 5. Sign in/out with PHP sessions.
    if ($action === 'login') {
        $email = strtolower(value($data, 'email'));
        $password = (string) ($data['password'] ?? '');
        $stmt = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $record = $stmt->fetch();
        if (!$record || !password_verify($password, $record['password_hash'])) {
            bad('Incorrect email or password.', 401);
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $record['id'];
        reply(['ok' => true, 'message' => 'Logged in successfully.', 'user' => getUser($pdo)]);
    }
    if ($action === 'logout') {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
        reply(['ok' => true, 'message' => 'Logged out.', 'csrf_token' => $_SESSION['csrf_token']]);
    }

    // 6. Create a booking. PHP calculates price and prevents date conflicts.
    if ($action === 'book') {
        $user = requireUser($user);
        $vehicleId = (int) ($data['vehicle_id'] ?? 0);
        $pickup = parseRentalDate(value($data, 'pickup_date'));
        $return = parseRentalDate(value($data, 'return_date'));
        $today = new DateTimeImmutable('today');
        $days = (int) $pickup->diff($return)->format('%r%a');
        if ($pickup < $today || $days <= 0 || $days > 90) {
            bad('Pickup cannot be in the past. Rental must be between 1 and 90 days.');
        }

        // Lock this vehicle while checking dates to avoid double bookings.
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('SELECT price_per_day, is_available FROM vehicles WHERE id = ? FOR UPDATE');
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch();
        if (!$vehicle || !(int) $vehicle['is_available']) bad('Vehicle is not available.');

        // Date ranges overlap if earlier pickup < later return AND earlier return > later pickup.
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings
            WHERE vehicle_id = ? AND status = 'Booked'
              AND pickup_date < ? AND return_date > ?");
        $stmt->execute([$vehicleId, $return->format('Y-m-d'), $pickup->format('Y-m-d')]);
        if ((int) $stmt->fetchColumn() > 0) bad('This vehicle is already booked for those dates.', 409);

        $total = number_format((float) $vehicle['price_per_day'] * $days, 2, '.', '');
        $stmt = $pdo->prepare('INSERT INTO bookings
            (user_id, vehicle_id, pickup_date, return_date, total_price)
            VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$user['id'], $vehicleId, $pickup->format('Y-m-d'), $return->format('Y-m-d'), $total]);
        $pdo->commit();
        reply(['ok' => true, 'message' => 'Vehicle booked successfully!', 'booking_id' => (int) $pdo->lastInsertId()], 201);
    }

    // 7. Update a booking status instead of deleting booking history.
    if ($action === 'cancel') {
        $user = requireUser($user);
        $bookingId = (int) ($data['booking_id'] ?? 0);
        $stmt = $pdo->prepare('SELECT user_id, status FROM bookings WHERE id = ?');
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();
        if (!$booking) bad('Booking not found.', 404);
        if ($user['role'] !== 'admin' && (int) $booking['user_id'] !== (int) $user['id']) {
            bad('You can cancel only your own bookings.', 403);
        }
        if ($booking['status'] === 'Cancelled') bad('This booking is already cancelled.');
        $stmt = $pdo->prepare("UPDATE bookings SET status = 'Cancelled' WHERE id = ?");
        $stmt->execute([$bookingId]);
        reply(['ok' => true, 'message' => 'Booking cancelled.']);
    }

    // 8. Admin-only CRUD for vehicles (uses existing six car pictures).
    if ($action === 'save_vehicle') {
        requireAdmin($user);
        $id = (int) ($data['id'] ?? 0);
        $name = value($data, 'name');
        $category = value($data, 'category');
        $transmission = value($data, 'transmission');
        $fuel = value($data, 'fuel');
        $seats = (int) ($data['seats'] ?? 0);
        $price = (float) ($data['price_per_day'] ?? 0);
        $image = value($data, 'image');
        $available = !empty($data['is_available']) ? 1 : 0;
        $allowedImages = ['sedan-silver.png', 'suv-white.png', 'hatchback-red.png',
                          'sedan-black.png', 'crossover-blue.png', 'pickup-gray.png'];

        if (!$name || strlen($name) > 100 || !$category || strlen($category) > 40
            || !$transmission || strlen($transmission) > 30 || !$fuel || strlen($fuel) > 30
            || $seats < 1 || $seats > 20 || !is_finite($price) || $price <= 0 || $price > 999999
            || !in_array($image, $allowedImages, true)) {
            bad('Please complete the vehicle details correctly.');
        }
        $fields = [$name, $category, $transmission, $fuel, $seats, $price, $image, $available];
        if ($id > 0) {
            $stmt = $pdo->prepare('UPDATE vehicles SET name = ?, category = ?, transmission = ?, fuel = ?,
                seats = ?, price_per_day = ?, image = ?, is_available = ? WHERE id = ?');
            $stmt->execute([...$fields, $id]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO vehicles
                (name, category, transmission, fuel, seats, price_per_day, image, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute($fields);
        }
        reply(['ok' => true, 'message' => 'Vehicle saved.']);
    }
    if ($action === 'delete_vehicle') {
        requireAdmin($user);
        $id = (int) ($data['id'] ?? 0);
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM bookings WHERE vehicle_id = ?');
        $stmt->execute([$id]);
        if ((int) $stmt->fetchColumn() > 0) {
            bad('This vehicle has booking history. Mark it unavailable instead.', 409);
        }
        $stmt = $pdo->prepare('DELETE FROM vehicles WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->rowCount()) bad('Vehicle not found.', 404);
        reply(['ok' => true, 'message' => 'Vehicle deleted.']);
    }

    bad('Unknown request.', 404);
} catch (ApiError $error) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    reply(['ok' => false, 'message' => $error->getMessage()], $error->httpStatus);
} catch (PDOException $error) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log('EzyDrive database error: ' . $error->getMessage());
    $message = $error->getCode() === '23000' ? 'A record with those details already exists.'
        : 'Database error. Check XAMPP MySQL and your SQL import.';
    reply(['ok' => false, 'message' => $message], 500);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log('EzyDrive error: ' . $error->getMessage());
    reply(['ok' => false, 'message' => 'Server error. Please try again.'], 500);
}
