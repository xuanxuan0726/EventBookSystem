<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Validator;
use PDOException;

final class RegistrationController
{
    private const SELECT = '
        SELECT r.id, r.event_id, r.name, r.email, r.created_at,
               e.title AS event_title, e.event_date, e.location, e.category, e.image_url
        FROM registrations r
        JOIN events e ON e.id = r.event_id';

    /**
     * POST /api/events/{id}/register   { "name": "...", "email": "..." }
     *
     * Concurrency strategy (see README "Race conditions"):
     *  1. SELECT ... FOR UPDATE locks the event row, so registrations for the SAME event
     *     are processed one at a time -> the capacity count cannot be exceeded.
     *  2. UNIQUE(email, event_day) makes MySQL reject a second registration for the same
     *     email on the same date, even if two requests for DIFFERENT events race.
     */
    public static function store(int $eventId): void
    {
        $data = Request::json();
        (new Validator($data))
            ->required('name', 'Name')->maxLength('name', 100, 'Name')
            ->required('email', 'Email')->maxLength('email', 150, 'Email')->email('email')
            ->validate();

        $name  = trim($data['name']);
        $email = strtolower(trim($data['email']));
        $db    = Database::connection();

        $db->beginTransaction();
        try {
            // 1. Lock the event row for the rest of this transaction
            $stmt = $db->prepare('SELECT id, event_date, max_attendees FROM events WHERE id = ? FOR UPDATE');
            $stmt->execute([$eventId]);
            $event = $stmt->fetch();

            if (!$event) {
                $db->rollBack();
                Response::error('Event not found.', 404);
            }
            if (strtotime($event['event_date']) <= time()) {
                $db->rollBack();
                Response::error('This event has already taken place.', 422);
            }
            $eventDay = substr($event['event_date'], 0, 10);

            // 2. Same-date rule (friendly message; the UNIQUE key is the final guarantee)
            $stmt = $db->prepare('SELECT event_id FROM registrations WHERE email = ? AND event_day = ?');
            $stmt->execute([$email, $eventDay]);
            if ($existing = $stmt->fetch()) {
                $db->rollBack();
                self::conflict((int) $existing['event_id'] === $eventId);
            }

            // 3. Capacity check — safe because the event row is locked
            $stmt = $db->prepare('SELECT COUNT(*) FROM registrations WHERE event_id = ?');
            $stmt->execute([$eventId]);
            if ((int) $stmt->fetchColumn() >= (int) $event['max_attendees']) {
                $db->rollBack();
                Response::error('Sorry, this event is fully booked.', 409);
            }

            // 4. Insert
            $db->prepare('INSERT INTO registrations (event_id, name, email, event_day) VALUES (?, ?, ?, ?)')
               ->execute([$eventId, $name, $email, $eventDay]);
            $id = (int) $db->lastInsertId();
            $db->commit();
        } catch (PDOException $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            // 1062 = duplicate key: a concurrent request registered this email on this date first
            if (($e->errorInfo[1] ?? null) === 1062) {
                self::conflict(false);
            }
            throw $e;
        }

        Response::success('Registered successfully.', self::find($id), 201);
    }

    /** GET /api/registrations?email=...  — a user's own registrations */
    public static function byEmail(): void
    {
        $email = Request::query('email');
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('A valid email is required.', 422, ['email' => 'Please enter a valid email address.']);
        }

        $stmt = Database::connection()->prepare(self::SELECT . ' WHERE r.email = ? ORDER BY e.event_date');
        $stmt->execute([strtolower($email)]);
        Response::success('Registrations retrieved.', array_map([self::class, 'present'], $stmt->fetchAll()));
    }

    /**
     * DELETE /api/registrations/{id}   { "email": "..." }
     * The user proves ownership with the email they registered with.
     * The seat is freed automatically because available slots are computed from COUNT(*).
     */
    public static function cancel(int $id): void
    {
        $data = Request::json();
        (new Validator($data))->required('email', 'Email')->email('email')->validate();

        $stmt = Database::connection()->prepare('DELETE FROM registrations WHERE id = ? AND email = ?');
        $stmt->execute([$id, strtolower(trim($data['email']))]);

        $stmt->rowCount()
            ? Response::success('Registration cancelled. Your slot has been released.')
            : Response::error('Registration not found for this email.', 404);
    }

    /** GET /api/admin/registrations  (admin) — every registration */
    public static function all(): void
    {
        Auth::requireAdmin();
        $rows = Database::connection()->query(self::SELECT . ' ORDER BY r.created_at DESC')->fetchAll();
        Response::success('Registrations retrieved.', array_map([self::class, 'present'], $rows));
    }

    /** DELETE /api/admin/registrations/{id}  (admin) */
    public static function adminCancel(int $id): void
    {
        Auth::requireAdmin();
        $stmt = Database::connection()->prepare('DELETE FROM registrations WHERE id = ?');
        $stmt->execute([$id]);

        $stmt->rowCount()
            ? Response::success('Registration cancelled.')
            : Response::error('Registration not found.', 404);
    }

    private static function conflict(bool $sameEvent): never
    {
        Response::error(
            $sameEvent
                ? 'You are already registered for this event.'
                : 'You already registered for an event on this date.',
            409
        );
    }

    private static function find(int $id): array
    {
        $stmt = Database::connection()->prepare(self::SELECT . ' WHERE r.id = ?');
        $stmt->execute([$id]);
        return self::present($stmt->fetch());
    }

    private static function present(array $r): array
    {
        $r['id']       = (int) $r['id'];
        $r['event_id'] = (int) $r['event_id'];
        return $r;
    }
}
