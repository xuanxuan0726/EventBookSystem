<?php

namespace App;

use DateTime;

/** Small field validator that collects errors per field. */
final class Validator
{
    private array $errors = [];

    public function __construct(private array $data) {}

    public function required(string $field, string $label): self
    {
        $value = $this->data[$field] ?? null;
        if ($value === null || (is_string($value) && trim($value) === '')) {
            $this->errors[$field] ??= "$label is required.";
        }
        return $this;
    }

    public function maxLength(string $field, int $max, string $label): self
    {
        $value = $this->data[$field] ?? '';
        if (is_string($value) && mb_strlen(trim($value)) > $max) {
            $this->errors[$field] ??= "$label must be at most $max characters.";
        }
        return $this;
    }

    public function email(string $field): self
    {
        $value = $this->data[$field] ?? '';
        if (is_string($value) && trim($value) !== '' && !filter_var(trim($value), FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] ??= 'Please enter a valid email address.';
        }
        return $this;
    }

    public function integer(string $field, int $min, int $max, string $label): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && $value !== '' &&
            filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]) === false) {
            $this->errors[$field] ??= "$label must be a whole number between $min and $max.";
        }
        return $this;
    }

    /** Optional field: if present, must be one of $allowed. */
    public function in(string $field, array $allowed, string $label): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && $value !== '' && !in_array($value, $allowed, true)) {
            $this->errors[$field] ??= "$label must be one of: " . implode(', ', $allowed) . '.';
        }
        return $this;
    }

    /** Optional field: an http(s) link, or a file path returned by the upload endpoint. */
    public function imageUrl(string $field, string $label): self
    {
        $value = trim((string) ($this->data[$field] ?? ''));
        if ($value === '' || preg_match(Controllers\UploadController::LOCAL_PATH_PATTERN, $value)) {
            return $this;
        }
        if (!filter_var($value, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $value)) {
            $this->errors[$field] ??= "$label must be an uploaded image or a valid http(s) link.";
        }
        return $this;
    }

    /** Record a rule checked outside this class (e.g. comparing two fields). */
    public function addError(string $field, string $message): self
    {
        $this->errors[$field] ??= $message;
        return $this;
    }

    /** Accepts "YYYY-MM-DD HH:MM[:SS]" or "YYYY-MM-DDTHH:MM[:SS]" and requires a future date. */
    public function futureDateTime(string $field, string $label): self
    {
        $value = $this->data[$field] ?? '';
        if (!is_string($value) || trim($value) === '') {
            return $this;
        }
        $dt = self::parseDateTime($value);
        if (!$dt) {
            $this->errors[$field] ??= "$label must be a valid date and time.";
        } elseif ($dt <= new DateTime()) {
            $this->errors[$field] ??= "$label must be in the future.";
        }
        return $this;
    }

    public static function parseDateTime(string $value): ?DateTime
    {
        $value = str_replace('T', ' ', trim($value));
        foreach (['Y-m-d H:i:s', 'Y-m-d H:i'] as $format) {
            $dt = DateTime::createFromFormat($format, $value);
            if ($dt && $dt->format($format) === $value) {
                return $dt;
            }
        }
        return null;
    }

    public static function isDate(string $value): bool
    {
        $dt = DateTime::createFromFormat('Y-m-d', $value);
        return $dt && $dt->format('Y-m-d') === $value;
    }

    /** Responds 422 with all collected field errors, if any. */
    public function validate(): void
    {
        if ($this->errors) {
            Response::error(reset($this->errors), 422, $this->errors);
        }
    }
}
