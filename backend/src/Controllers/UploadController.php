<?php

namespace App\Controllers;

use App\Auth;
use App\Response;

/**
 * POST /api/admin/uploads  (admin, multipart/form-data, field "image")
 *
 * Security:
 *  - Admin-only.
 *  - The file type is detected from the file's CONTENT (finfo + getimagesize), never from the
 *    client's filename or Content-Type header.
 *  - The stored name is random and its extension comes from the detected type, so nothing
 *    executable (e.g. .php) can ever be written.
 */
final class UploadController
{
    public const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

    /** Paths this endpoint produces, e.g. /uploads/3f9c...e1.jpg */
    public const LOCAL_PATH_PATTERN = '#^/uploads/[a-f0-9]{32}\.(jpg|png|webp|gif)$#';

    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
    ];

    public static function store(): void
    {
        Auth::requireAdmin();

        $file = $_FILES['image'] ?? null;
        if (!$file || is_array($file['error'])) {
            Response::error('Please choose an image file to upload.', 422);
        }

        match ($file['error']) {
            UPLOAD_ERR_OK => null,
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => Response::error('Image must be 5 MB or smaller.', 422),
            UPLOAD_ERR_NO_FILE => Response::error('Please choose an image file to upload.', 422),
            default => Response::error('Upload failed. Please try again.', 500),
        };

        if ($file['size'] > self::MAX_BYTES) {
            Response::error('Image must be 5 MB or smaller.', 422);
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $ext  = self::TYPES[$mime] ?? null;
        if (!$ext || @getimagesize($file['tmp_name']) === false) {
            Response::error('Only JPG, PNG, WEBP or GIF images are allowed.', 422);
        }

        $dir = self::directory();
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            Response::error('Upload folder is not writable.', 500);
        }

        $name = bin2hex(random_bytes(16)) . ".$ext";
        if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
            Response::error('Could not save the uploaded image.', 500);
        }

        Response::success('Image uploaded.', ['url' => "/uploads/$name"], 201);
    }

    /** Remove a file previously produced by store(); external links are ignored. */
    public static function deleteIfLocal(?string $url): void
    {
        if ($url && preg_match(self::LOCAL_PATH_PATTERN, $url)) {
            @unlink(self::directory() . '/' . basename($url));
        }
    }

    private static function directory(): string
    {
        return dirname(__DIR__, 2) . '/public/uploads';
    }
}
