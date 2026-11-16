<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Validator;

final class AuthController
{
    /** POST /api/admin/login  { "username": "...", "password": "..." } */
    public static function login(): void
    {
        $data = Request::json();
        (new Validator($data))
            ->required('username', 'Username')
            ->required('password', 'Password')
            ->validate();

        $stmt = Database::connection()->prepare('SELECT id, username, password_hash FROM admins WHERE username = ?');
        $stmt->execute([trim($data['username'])]);
        $admin = $stmt->fetch();

        // Same generic message for unknown user and wrong password (no user enumeration)
        if (!$admin || !password_verify((string) $data['password'], $admin['password_hash'])) {
            Response::error('Invalid username or password.', 401);
        }

        $token = Auth::issueToken((int) $admin['id']);
        Response::success('Logged in successfully.', [
            'token'      => $token['token'],
            'expires_at' => $token['expires_at'],
            'admin'      => ['id' => (int) $admin['id'], 'username' => $admin['username']],
        ]);
    }

    /** GET /api/admin/me — validates the current token */
    public static function me(): void
    {
        $admin = Auth::requireAdmin();
        Response::success('Authenticated.', ['id' => (int) $admin['id'], 'username' => $admin['username']]);
    }

    /** POST /api/admin/logout */
    public static function logout(): void
    {
        Auth::requireAdmin();
        Auth::revokeCurrentToken();
        Response::success('Logged out.');
    }
}
