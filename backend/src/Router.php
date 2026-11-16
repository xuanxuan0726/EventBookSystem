<?php

namespace App;

/** Minimal router: maps "METHOD /path/{param}" to a callable. */
final class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        // "/api/events/{id}" -> "#^/api/events/(?P<id>\d+)$#"
        $regex = preg_replace('#\{(\w+)\}#', '(?P<$1>\d+)', $pattern);
        $this->routes[] = [$method, "#^{$regex}$#", $handler];
    }

    public function dispatch(string $method, string $path): void
    {
        $pathMatched = false;

        foreach ($this->routes as [$routeMethod, $regex, $handler]) {
            if (!preg_match($regex, $path, $m)) {
                continue;
            }
            $pathMatched = true;
            if ($routeMethod === $method) {
                // Positional args (array_values) so handler parameter names don't have to match
                $params = array_values(array_map('intval', array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY)));
                $handler(...$params);
                return;
            }
        }

        $pathMatched
            ? Response::error('Method not allowed.', 405)
            : Response::error('Endpoint not found.', 404);
    }
}
