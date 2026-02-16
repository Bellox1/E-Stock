<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordOTP;
use App\Mail\ProfileUpdateOTP;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inscription d'un nouvel utilisateur
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'name.required' => 'Le nom est obligatoire.',
            'email.required' => 'L\'adresse email est obligatoire.',
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit faire au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        // Vérifier si les permissions par défaut autorisent au moins 1 boutique
        $defaultShops = $user->getPermission('shops', 1);

        if ($defaultShops > 0) {
            // Créer une boutique par défaut seulement si autorisé
            $user->shops()->create([
                'name' => 'Ma Boutique',
                'description' => 'Boutique créée par défaut',
            ]);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Inscription réussie'
        ], 201);
    }

    /**
     * Connexion d'un utilisateur
     */
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string', // Peut être email ou téléphone
            'password' => 'required',
        ]);

        // Chercher par email ou par téléphone
        $user = User::where(function($query) use ($request) {
            $query->where('email', $request->login)
                  ->orWhere('phone', $request->login);
        })->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Connexion réussie'
        ]);
    }

    /**
     * Déconnexion de l'utilisateur
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Obtenir l'utilisateur connecté
     */
    public function user(Request $request)
    {
        return response()->json($request->user()->load('activeSubscription.offer'));
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ], [
            'current_password.required' => 'Le mot de passe actuel est obligatoire.',
            'new_password.required' => 'Le nouveau mot de passe est obligatoire.',
            'new_password.min' => 'Le mot de passe doit faire au moins 8 caractères.',
            'new_password.confirmed' => 'La confirmation du nouveau mot de passe ne correspond pas.',
        ]);

        $user = $request->user();

        // Vérifier le mot de passe actuel
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect'
            ], 422);
        }

        // Mettre à jour le mot de passe
        $user->update([
            'password' => Hash::make($validated['new_password'])
        ]);

        return response()->json([
            'message' => 'Mot de passe modifié avec succès'
        ]);
    }

    /**
     * Demander un OTP pour modifier le profil (Email/Tel)
     */
    public function requestProfileUpdateOTP(Request $request)
    {
        $user = $request->user();
        
        // Générer un code à 6 chiffres
        $otp = rand(100000, 999999);
        $user->otp_code = $otp;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        try {
            Mail::to($user->email)->send(new ProfileUpdateOTP($otp));
            return response()->json(['message' => 'Un code de confirmation a été envoyé à votre adresse email actuelle']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'envoi de l\'email.'], 500);
        }
    }

    /**
     * Mettre à jour le profil avec vérification OTP
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
        ];

        // Si l'email ou le téléphone change, on exige l'OTP
        if ($request->email !== $user->email || $request->phone !== $user->phone) {
            $rules['otp_code'] = 'required|string|size:6';
        }

        $validated = $request->validate($rules, [
            'name.required' => 'Le nom est obligatoire.',
            'email.required' => 'L\'adresse email est obligatoire.',
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée par un autre compte.',
            'otp_code.required' => 'Le code de confirmation est obligatoire pour modifier vos identifiants.',
            'otp_code.size' => 'Le code doit contenir 6 chiffres.',
        ]);

        if (isset($validated['otp_code'])) {
            if ($user->otp_code !== $validated['otp_code'] || now()->gt($user->otp_expires_at)) {
                return response()->json(['message' => 'Code de confirmation invalide ou expiré'], 422);
            }
            // Vider l'OTP après usage
            $user->otp_code = null;
            $user->otp_expires_at = null;
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
        ]);

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user' => $user
        ]);
    }

    /**
     * Mot de passe oublié (Envoi de code OTP)
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => "Cet adresse email n'est associée à aucun compte.",
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.required' => "L'adresse email est obligatoire.",
        ]);

        $user = User::where('email', $request->email)->first();
        
        // Générer un code à 6 chiffres
        $otp = rand(100000, 999999);
        $user->otp_code = $otp;
        $user->otp_expires_at = now()->addMinutes(15);
        $user->save();

        // Envoi du mail
        try {
            Mail::to($user->email)->send(new ResetPasswordOTP($otp));
            
            return response()->json([
                'message' => 'Un code de vérification a été envoyé à votre adresse email'
            ]);
        } catch (\Exception $e) {
            // En cas d'erreur de mail, on log l'erreur pour le debug
            \Illuminate\Support\Facades\Log::error('Mail error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
            ], 500);
        }
    }

    /**
     * Réinitialisation du mot de passe avec OTP
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp_code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.exists' => "Cet adresse email n'est associée à aucun compte.",
            'otp_code.required' => 'Le code de vérification est obligatoire.',
            'otp_code.size' => 'Le code doit contenir 6 chiffres.',
            'password.required' => 'Le nouveau mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit faire au moins 8 caractères.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ]);

        $user = User::where('email', $request->email)
                    ->where('otp_code', $request->otp_code)
                    ->where('otp_expires_at', '>', now())
                    ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Code de vérification invalide ou expiré'
            ], 422);
        }

        // Mettre à jour le mot de passe et vider l'OTP
        $user->update([
            'password' => Hash::make($request->password),
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        return response()->json([
            'message' => 'Mot de passe réinitialisé avec succès'
        ]);
    }

    /**
     * Liste des marchands (Admin)
     */
    public function index()
    {
        $users = User::withCount('shops')
            ->with('activeSubscription.offer')
            ->latest()
            ->get();
        return response()->json($users);
    }

    /**
     * Créer un nouvel administrateur (Sub-Admin)
     */
    public function storeAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'can_write' => 'boolean'
        ], [
            'name.required' => 'Le nom est obligatoire.',
            'email.required' => 'L\'adresse email est obligatoire.',
            'email.email' => 'Veuillez entrer une adresse email valide.',
            'email.unique' => 'Cette adresse email est déjà utilisée par un autre compte.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit faire au moins 8 caractères.',
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'is_admin' => true,
            'admin_permissions' => [
                'can_write' => $validated['can_write'] ?? false
            ]
        ]);

        return response()->json([
            'message' => 'Nouvel administrateur créé avec succès',
            'user' => $admin
        ], 201);
    }

    /**
     * Mettre à jour un administrateur
     */
    public function updateAdmin(Request $request, $id)
    {
        $admin = User::where('is_admin', true)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'can_write' => 'boolean'
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'admin_permissions' => [
                'can_write' => $validated['can_write'] ?? false
            ]
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $admin->update($updateData);

        return response()->json([
            'message' => 'Administrateur mis à jour avec succès',
            'user' => $admin
        ]);
    }

    /**
     * Supprimer un administrateur
     */
    public function destroyAdmin(Request $request, $id)
    {
        $admin = User::where('is_admin', true)->findOrFail($id);

        // Interdire de se supprimer soi-même
        if ($id == $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        $admin->delete();

        return response()->json([
            'message' => 'Administrateur supprimé avec succès'
        ]);
    }

    /**
     * Obtenir la configuration publique de l'application
     */
    public function publicConfig()
    {
        return response()->json([
            'app_name' => config('app.name'),
            'app_num' => config('app.app_num'),
            'app_email' => config('app.app_email'),
            'app_logo_url' => env('APP_URL') . '/storage/app_image.png',
            'by_logo_url' => env('APP_URL') . '/storage/by.png',
        ]);
    }
}
