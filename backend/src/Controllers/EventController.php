<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Validator;

final class EventController
{
    public const CATEGORIES = [
        'Music', 'Conference', 'Seminar', 'Workshop', 'Networking', 'Sports', 'Arts', 'Comedy', 'Other',
    ];

    /** ?sort= value => ORDER BY clause (whitelisted, never interpolated from user input) */
    private const SORTS = [
        // Upcoming events first (soonest at the top), past events at the end
        'upcoming' => '(e.event_date < NOW()) ASC, e.event_date ASC',
        'latest'   => 'e.event_date DESC',
        'popular'  => 'registered_count DESC, e.event_date ASC',
    ];

    /** Columns returned for every event. Seat counts include CONFIRMED bookings only. */
    private const SELECT = "
        SELECT e.id, e.title, e.category, e.description, e.location, e.image_url,
               e.event_date, e.registration_deadline, e.max_attendees,
               COUNT(r.id)                   AS registered_count,
               e.max_attendees - COUNT(r.id) AS available_slots
        FROM events e
        LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'";

    /** GET /api/events?search=&date=YYYY-MM-DD&category=&location=&sort=upcoming|latest|popular */
    public static function index(): void
    {
        $where  = [];
        $params = [];

        if ($date = Request::query('date')) {
            if (!Validator::isDate($date)) {
                Response::error('Filter date must be in YYYY-MM-DD format.', 422);
            }
            // Range instead of DATE(event_date) = ? so the index on event_date can be used
            $where[]  = 'e.event_date >= ? AND e.event_date < ? + INTERVAL 1 DAY';
            array_push($params, $date, $date);
        }
        if ($search = Request::query('search')) {
            $where[]  = '(e.title LIKE ? OR e.location LIKE ?)';
            $like     = '%' . addcslashes($search, '%_\\') . '%';
            array_push($params, $like, $like);
        }
        if ($category = Request::query('category')) {
            $where[]  = 'e.category = ?';
            $params[] = $category;
        }
        if ($location = Request::query('location')) {
            $where[]  = 'e.location = ?';
            $params[] = $location;
        }
        $sort = self::SORTS[Request::query('sort') ?? 'upcoming'] ?? null;
        if ($sort === null) {
            Response::error('Sort must be one of: ' . implode(', ', array_keys(self::SORTS)) . '.', 422);
        }

        $sql = self::SELECT
            . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
            . " GROUP BY e.id ORDER BY $sort";

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);

        Response::success('Events retrieved.', array_map([self::class, 'present'], $stmt->fetchAll()));
    }

    /** GET /api/events/{id} */
    public static function show(int $id): void
    {
        Response::success('Event retrieved.', self::present(self::findOrFail($id)));
    }

    /** POST /api/events  (admin) */
    public static function store(): void
    {
        Auth::requireAdmin();
        $data = Request::json();

        $validator = (new Validator($data))
            ->required('title', 'Title')->maxLength('title', 150, 'Title')
            ->required('location', 'Location')->maxLength('location', 150, 'Location')
            ->required('event_date', 'Event date')->futureDateTime('event_date', 'Event date')
            ->futureDateTime('registration_deadline', 'Registration deadline')
            ->required('max_attendees', 'Max attendees')->integer('max_attendees', 1, 100000, 'Max attendees')
            ->maxLength('description', 2000, 'Description')
            ->in('category', self::CATEGORIES, 'Category')
            ->imageUrl('image_url', 'Cover image')->maxLength('image_url', 500, 'Cover image');

        $eventDate = Validator::parseDateTime((string) ($data['event_date'] ?? ''));
        $deadline  = Validator::parseDateTime((string) ($data['registration_deadline'] ?? ''));
        if ($eventDate && $deadline && $deadline > $eventDate) {
            $validator->addError('registration_deadline', 'Registration deadline must be on or before the event date.');
        }
        $validator->validate();

        $db = Database::connection();
        $db->prepare(
            'INSERT INTO events (title, category, description, location, image_url, event_date, registration_deadline, max_attendees)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            trim($data['title']),
            ($data['category'] ?? '') ?: 'Other',
            trim((string) ($data['description'] ?? '')) ?: null,
            trim($data['location']),
            trim((string) ($data['image_url'] ?? '')) ?: null,
            $eventDate->format('Y-m-d H:i:s'),
            $deadline?->format('Y-m-d H:i:s'),
            (int) $data['max_attendees'],
        ]);

        $event = self::findOrFail((int) $db->lastInsertId());
        Response::success('Event created successfully.', self::present($event), 201);
    }

    /** DELETE /api/events/{id}  (admin). Registrations are removed by ON DELETE CASCADE. */
    public static function destroy(int $id): void
    {
        Auth::requireAdmin();
        $event = self::findOrFail($id);

        Database::connection()->prepare('DELETE FROM events WHERE id = ?')->execute([$id]);
        UploadController::deleteIfLocal($event['image_url']);

        Response::success('Event deleted successfully.');
    }

    public static function findOrFail(int $id): array
    {
        $stmt = Database::connection()->prepare(self::SELECT . ' WHERE e.id = ? GROUP BY e.id');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: Response::error('Event not found.', 404);
    }

    /** Normalise types and add derived flags for the frontend. */
    public static function present(array $e): array
    {
        $available = max(0, (int) $e['available_slots']);
        $now       = time();
        $isPast    = strtotime($e['event_date']) <= $now;
        // No deadline set => registration closes when the event starts
        $closesAt  = $e['registration_deadline'] ?? $e['event_date'];
        $closed    = strtotime($closesAt) <= $now;

        return [
            'id'                    => (int) $e['id'],
            'title'                 => $e['title'],
            'category'              => $e['category'],
            'description'           => $e['description'],
            'location'              => $e['location'],
            'image_url'             => $e['image_url'],
            'event_date'            => $e['event_date'],
            'registration_deadline' => $closesAt,
            'max_attendees'         => (int) $e['max_attendees'],
            'registered_count'      => (int) $e['registered_count'],
            'available_slots'       => $available,
            'is_full'               => $available === 0,
            'is_past'               => $isPast,
            'registration_closed'   => $closed,
            'registration_open'     => !$closed && $available > 0,
        ];
    }
}
