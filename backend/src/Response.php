<?php

namespace App;

/**
 * Every API response has the same shape:
 *   { "success": bool, "message": string, "data"?: mixed, "errors"?: object }
 */
final class Response
{
    public static function success(string $message, $data = null, int $status = 200): never
    {
        $body = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $body['data'] = $data;
        }
        self::send($body, $status);
    }

    /** @param array<string,string> $errors field => message (validation errors) */
    public static function error(string $message, int $status = 400, array $errors = []): never
    {
        $body = ['success' => false, 'message' => $message];
        if ($errors) {
            $body['errors'] = $errors;
        }
        self::send($body, $status);
    }

    private static function send(array $body, int $status): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
