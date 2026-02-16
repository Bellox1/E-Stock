<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'is_admin',
        'password',
        'otp_code',
        'otp_expires_at',
        'admin_permissions',
    ];

    protected $appends = ['permissions'];

    public function getPermissionsAttribute()
    {
        // 1. Récupérer les permissions par défaut (Global Settings)
        $defaultPermsSetting = AppSetting::where('key', 'default_permissions')->first();
        $globalPermissions = $defaultPermsSetting ? $defaultPermsSetting->value : [
            'shops' => 1,
            'products' => 0,
            'clients' => 0,
            'stock_alerts' => true,
            'alerts' => false,
            'invoices' => false,
            'stats' => false,
            'export_excel' => false
        ];

        // 2. Récupérer l'abonnement actif
        $sub = $this->activeSubscription;
        
        // 3. Si pas d'offre, retourner les globales
        if (!$sub || !$sub->offer) {
            return $globalPermissions;
        }

        // 4. Si offre, fusionner : les permissions de l'offre écrasent les globales si définies,
        // mais on garde les globales si elles donnent plus de droits (logique additive pour les booléens)
        $offerPermissions = $sub->offer->permissions;

        // Fusion intelligente :
        // Pour les nombres (limites), on prend le max entre global et offre
        // Pour les booléens, on prend le OR (si actif globalement ou dans l'offre, c'est actif)
        $mergedPermissions = $globalPermissions;

        foreach ($offerPermissions as $key => $value) {
            if (is_numeric($value) && isset($globalPermissions[$key]) && is_numeric($globalPermissions[$key])) {
                // Pour les limites (produits, boutiques...), on prend le MAX
                $mergedPermissions[$key] = max($value, $globalPermissions[$key]);
            } elseif (is_bool($value) && isset($globalPermissions[$key]) && is_bool($globalPermissions[$key])) {
                // Pour les switchs (export, stats...), on prend le OR (si l'un des deux est vrai, c'est vrai)
                $mergedPermissions[$key] = $value || $globalPermissions[$key];
            } else {
                // Sinon on prend la valeur de l'offre
                $mergedPermissions[$key] = $value;
            }
        }
        
        return $mergedPermissions;
    }

    public function shops()
    {
        return $this->hasMany(Shop::class);
    }

    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(Subscription::class)
            ->where('status', 'active')
            ->where(function($q) {
                $q->whereNull('ends_at')
                  ->orWhere('ends_at', '>', now());
            })
            ->latest('id');
    }

    public function getPermission($key, $default = null)
    {
        $permissions = $this->permissions;
        return $permissions[$key] ?? $default;
    }

    public function hasPermission($key)
    {
        return (bool) $this->getPermission($key, false);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'admin_permissions' => 'array',
        ];
    }
}
