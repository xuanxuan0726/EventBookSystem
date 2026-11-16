<?php

namespace App\Controllers;

use App\Auth;
use App\Database;
use App\Request;
use App\Response;
use App\Validator;

final class EventController
{
    public const CATEGORIES = ['Music', 'Conference', 'Workshop', 'Networking', 'Sports', 'Arts', 'Comedy', 'Other'];

    /** ?sort= value => ORDER BY clause (whitelisted, never interpolated from user input) */
    private const SORTS = [
        'date'    => 'e.event_date ASC',
        'popular' => 'registered_count DESC, e.event_date ASC',
        'seats'   => 'available_slots DESC, e.event_date ASC',
    ];

    /** Columns returned for every event, including live seat counts. */
    private const SELECT = "
        SELECT e.id, e.title, e.category, e.description, e.location, e.image_url, e.event_date, e.max_attendees,
               COUNT(r.id)                   AS registered_count,
               e.max_attendees - COUNT(r.id) AS available_slots
        FROM events e
        LEFT JOIN registrations r ON r.event_id = e.id";

    /** GET /api/events?date=YYYY-MM-DD&search=text&category=Music&location=...&sort=date|popular|seats */
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
        $sort = self::SORTS[Request::query('sort') ?? 'date'] ?? null;
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

        (new Validator($data))
            ->required('title', 'Title')->maxLength('title', 150, 'Title')
            ->required('location', 'Location')->maxLength('location', 150, 'Location')
            ->required('event_date', 'Event date')->futureDateTime('event_date', 'Event date')
            ->required('max_attendees', 'Max attendees')->integer('max_attendees', 1, 100000, 'Max attendees')
            ->maxLength('description', 2000, 'Description')
            ->in('category', self::CATEGORIES, 'Category')
            ->url('image_url', 'Image URL')->maxLength('image_url', 500, 'Image URL')
            ->validate();

        $db = Database::connection();
        $db->prepare(
            'INSERT INTO events (title, category, description, location, image_url, event_date, max_attendees)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            trim($data['title']),
            $data['category'] ?? 'Other',
            trim((string) ($data['description'] ?? '')) ?: null,
            trim($data['location']),
            trim((string) ($data['image_url'] ?? '')) ?: null,
            Validator::parseDateTime($data['event_date'])->format('Y-m-d H:i:s'),
            (int) $data['max_attendees'],
        ]);

        $event = self::findOrFail((int) $db->lastInsertId());
        Response::success('Event created successfully.', self::present($event), 201);
    }

    /** DELETE /api/events/{id}  (admin) — registrations are removed by ON DELETE CASCADE */
    public static function destroy(int $id): void
    {
        Auth::requireAdmin();
        self::findOrFail($id);

        Database::connection()->prepare('DELETE FROM events WHERE id = ?')->execute([$id]);
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
        return [
            'id'               => (int) $e['id'],
            'title'            => $e['title'],
            'category'         => $e['category'],
            'description'      => $e['description'],
            'location'         => $e['location'],
            'image_url'        => $e['image_url'],
            'event_date'       => $e['event_date'],
            'max_attendees'    => (int) $e['max_attendees'],
            'registered_count' => (int) $e['registered_count'],
            'available_slots'  => $available,
            'is_full'          => $available === 0,
            'is_past'          => strtotime($e['event_date']) <= time(),
        ];
    }
}
