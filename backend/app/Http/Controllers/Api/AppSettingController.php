<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class AppSettingController extends Controller
{
    /**
     * Liste tous les réglages
     */
    public function index()
    {
        return response()->json(AppSetting::all());
    }

    /**
     * Récupérer un réglage par sa clé
     */
    public function show($key)
    {
        $setting = AppSetting::where('key', $key)->firstOrFail();
        return response()->json($setting);
    }

    /**
     * Mettre à jour un réglage
     */
    public function update(Request $request, $key)
    {
        $setting = AppSetting::where('key', $key)->firstOrFail();
        
        $validated = $request->validate([
            'value' => 'required',
            'description' => 'nullable|string'
        ]);

        $setting->update($validated);

        return response()->json([
            'message' => 'Réglage mis à jour avec succès',
            'setting' => $setting
        ]);
    }
}
