<?php

namespace App;

/**
 * Token-based admin authentication.
 * On login a random 256-bit token is returned to the client; only its SHA-256
 * hash is stored, so a leaked database does not leak usable tokens.
 */
final class Auth
{
    public static function issueToken(int $adminId): array
    {
        $ttl       = (require __DIR__ . '/../config/config.php')['token_ttl_hours'];
        $token     = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $ttl * 3600);

        $db = Database::connection();
        // Housekeeping: remove expired tokens
        $db->exec('DELETE FROM api_tokens WHERE expires_at < NOW()');
        $db->prepare('INSERT INTO api_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)')
           ->execute([$adminId, hash('sha256', $token), $expiresAt]);

        return ['token' => $token, 'expires_at' => $expiresAt];
    }

    /** Returns the logged-in admin or responds 401. */
    public static function requireAdmin(): array
    {
        $token = Request::bearerToken();
        if (!$token) {
            Response::error('Authentication required.', 401);
        }

        $stmt = Database::connection()->prepare(
            'SELECT a.id, a.username
             FROM api_tokens t
             JOIN admins a ON a.id = t.admin_id
             WHERE t.token_hash = ? AND t.expires_at > NOW()'
        );
        $stmt->execute([hash('sha256', $token)]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Session expired or invalid token. Please log in again.', 401);
        }
        return $admin;
    }

    public static function revokeCurrentToken(): void
    {
        $token = Request::bearerToken();
        if ($token) {
            Database::connection()
                ->prepare('DELETE FROM api_tokens WHERE token_hash = ?')
                ->execute([hash('sha256', $token)]);
        }
    }
}
