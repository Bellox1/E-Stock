<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    /**
     * Liste des annonces actives (Public/Marchand)
     */
    public function index()
    {
        return response()->json(Announcement::where('is_active', true)->latest()->get());
    }

    /**
     * Liste toutes les annonces (Admin)
     */
    public function adminIndex()
    {
        return response()->json(Announcement::latest()->get());
    }

    /**
     * Créer une annonce (Admin)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:4096', // Max 4MB
            'is_active' => 'boolean',
        ], [
            'image_url.url' => 'Le format de l\'URL de l\'image est invalide.',
            'image.image' => 'Le fichier doit être une image.',
            'image.max' => 'L\'image ne doit pas dépasser 4Mo.',
        ]);

        $data = $request->only(['title', 'content', 'is_active', 'image_url']);
        
        // Default values if empty
        if (empty($data['title'])) $data['title'] = 'Sans titre';
        if (empty($data['content'])) $data['content'] = '';
        if (!isset($data['is_active'])) $data['is_active'] = true;

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('announcements', 'public');
            $data['image_url'] = url('/storage/' . $path);
        }

        // Check if we have an image
        if (empty($data['image_url'])) {
            return response()->json(['message' => 'Une image est obligatoire.'], 422);
        }

        $announcement = Announcement::create($data);
        return response()->json($announcement, 201);
    }

    /**
     * Voir une annonce
     */
    public function show(Announcement $announcement)
    {
        return response()->json($announcement);
    }

    /**
     * Modifier une annonce (Admin)
     */
    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'image_url' => 'nullable|url',
            'image' => 'nullable|image|max:4096',
            'is_active' => 'boolean',
        ], [
            'image_url.url' => 'Le format de l\'URL de l\'image est invalide.',
            'image.image' => 'Le fichier doit être une image.',
            'image.max' => 'L\'image ne doit pas dépasser 4Mo.',
        ]);

        $data = $request->only(['title', 'content', 'is_active', 'image_url']);

        if ($request->hasFile('image')) {
            // Supprimer l'ancienne image si elle existe
            if ($announcement->image_url) {
                $oldPath = str_replace(url('/storage/'), '', $announcement->image_url);
                if ($oldPath === $announcement->image_url) {
                    $oldPath = str_replace(asset('storage/'), '', $announcement->image_url);
                }
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('announcements', 'public');
            $data['image_url'] = url('/storage/' . $path);
        }
        
        // If image_url is explicitly null, we might want to keep the old one or let it be if user deleted it? 
        // Frontend sends image_url if it exists.
        
        $announcement->update(array_filter($data, function($v) { return !is_null($v); }));
        
        return response()->json($announcement);
    }

    /**
     * Supprimer une annonce (Admin)
     */
    public function destroy(Announcement $announcement)
    {
        // Supprimer l'image si elle existe
        if ($announcement->image_url) {
            $path = str_replace(url('/storage/'), '', $announcement->image_url);
            if ($path === $announcement->image_url) {
                $path = str_replace(asset('storage/'), '', $announcement->image_url);
            }
            Storage::disk('public')->delete($path);
        }

        $announcement->delete();
        return response()->json(null, 204);
    }
}
