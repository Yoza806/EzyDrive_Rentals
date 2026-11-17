<?php
/**
 * EzyDrive Rentals - Database Connection
 * ---------------------------------------
 * XAMPP defaults: localhost, root, empty password.
 * Change these values if your MySQL setup is different.
 */

declare(strict_types=1);

function db(): PDO
{
    static $connection = null;

    if ($connection === null) {
        $host = '127.0.0.1';
        $database = 'ezydrive_rentals';
        $username = 'root';
        $password = '';

        $connection = new PDO(
            "mysql:host=$host;dbname=$database;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
    }

    return $connection;
}
