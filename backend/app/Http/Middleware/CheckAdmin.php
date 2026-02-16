<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_admin) {
            return response()->json(['message' => 'Accès refusé. Administrateur uniquement.'], 403);
        }

        // Si c'est une action de modification (POST, PUT, DELETE, PATCH)
        // et que l'utilisateur n'a pas la permission d'écriture
        if (!$request->isMethod('GET')) {
            $perms = $user->admin_permissions;
            
            // Si c'est un sous-admin (qui a des permissions définies)
            // on vérifie s'il a explicitement le droit d'écriture
            if ($perms && (!isset($perms['can_write']) || !$perms['can_write'])) {
                return response()->json([
                    'message' => 'Action refusée. Vous avez uniquement les droits de lecture.'
                ], 403);
            }
        }

        return $next($request);
    }
}
