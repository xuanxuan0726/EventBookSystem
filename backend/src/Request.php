<?php

namespace App;

final class Request
{
    private static ?array $body = null;

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        return rtrim($path, '/') ?: '/';
    }

    /** Parsed JSON body. Responds 400 if the body is not valid JSON. */
    public static function json(): array
    {
        if (self::$body === null) {
            $raw = file_get_contents('php://input');
            if ($raw === '' || $raw === false) {
                self::$body = [];
            } else {
                $data = json_decode($raw, true);
                if (!is_array($data)) {
                    Response::error('Request body must be valid JSON.', 400);
                }
                self::$body = $data;
            }
        }
        return self::$body;
    }

    public static function query(string $key): ?string
    {
        $value = $_GET[$key] ?? null;
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    public static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? (function_exists('getallheaders') ? (getallheaders()['Authorization'] ?? '') : '');

        return preg_match('/^Bearer\s+(\S+)$/i', $header, $m) ? $m[1] : null;
    }
}
