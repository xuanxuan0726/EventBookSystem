<?php
/**
 * Front controller — every API request enters here.
 *   Dev:    php -S localhost:8000 -t public public/index.php   (from the backend folder)
 *   Apache: point the document root at /public (.htaccess rewrites to this file)
 */

declare(strict_types=1);

// PHP's built-in dev server: let it serve uploaded images directly (Apache does this via .htaccess)
if (PHP_SAPI === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (str_starts_with($path, '/uploads/') && is_file(__DIR__ . $path)) {
        return false;
    }
}

use App\Controllers\AuthController;
use App\Controllers\EventController;
use App\Controllers\RegistrationController;
use App\Controllers\UploadController;
use App\Request;
use App\Response;
use App\Router;

// --- Autoload App\* classes from /src --------------------------------------------
spl_autoload_register(function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        require __DIR__ . '/../src/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    }
});

$config = require __DIR__ . '/../config/config.php';
date_default_timezone_set($config['timezone']);

// --- CORS ------------------------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $config['cors_origins'], true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
if (Request::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Global error handler: never leak stack traces to clients ----------------------
set_exception_handler(function (Throwable $e): void {
    error_log((string) $e);
    $message = $e instanceof PDOException && str_contains($e->getMessage(), 'Unknown database')
        ? 'Database not found. Import backend/database/schema.sql first.'
        : 'Internal server error.';
    Response::error($message, 500);
});

// --- Routes --------------------------------------------------------------------------
$router = new Router();

// Public
$router->add('GET',    '/api/events',               [EventController::class, 'index']);
$router->add('GET',    '/api/events/{id}',          [EventController::class, 'show']);
$router->add('POST',   '/api/events/{id}/register', [RegistrationController::class, 'store']);
$router->add('GET',    '/api/registrations',        [RegistrationController::class, 'byEmail']);
$router->add('DELETE', '/api/registrations/{id}',   [RegistrationController::class, 'cancel']);

// Admin auth
$router->add('POST',   '/api/admin/login',          [AuthController::class, 'login']);
$router->add('POST',   '/api/admin/logout',         [AuthController::class, 'logout']);
$router->add('GET',    '/api/admin/me',             [AuthController::class, 'me']);

// Admin only (Bearer token)
$router->add('POST',   '/api/events',               [EventController::class, 'store']);
$router->add('DELETE', '/api/events/{id}',          [EventController::class, 'destroy']);
$router->add('POST',   '/api/admin/uploads',        [UploadController::class, 'store']);
$router->add('GET',    '/api/admin/registrations',  [RegistrationController::class, 'all']);
$router->add('DELETE', '/api/admin/registrations/{id}', [RegistrationController::class, 'adminCancel']);

$router->dispatch(Request::method(), Request::path());
