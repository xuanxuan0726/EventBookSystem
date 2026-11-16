<?php
// Application configuration. Each value can be overridden with an environment variable.

return [
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'name' => getenv('DB_NAME') ?: 'event_booking',
        'user' => getenv('DB_USER') ?: 'root',
        'pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    ],
    // How long an admin login token stays valid
    'token_ttl_hours' => 8,
    // Origins allowed to call the API from a browser
    'cors_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
    // Events and registrations use this timezone for "same date" checks
    'timezone' => 'Asia/Kuala_Lumpur',
];
