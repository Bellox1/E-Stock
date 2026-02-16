<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\ShopController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\NotificationController; // Added this line
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\PricingRuleController;
use App\Http\Controllers\Api\AppSettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/config', [AuthController::class, 'publicConfig']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/user/request-profile-otp', [AuthController::class, 'requestProfileUpdateOTP']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);

    // Offres (Lecture seule pour tous, CRUD pour admin)
    Route::get('/offers', [OfferController::class, 'index']);
    Route::get('/offers/{offer}', [OfferController::class, 'show']);
    
    // Boutiques
    Route::apiResource('shops', ShopController::class);
    
    // Catégories
    Route::apiResource('categories', CategoryController::class);
    
    // Produits
    Route::apiResource('products', ProductController::class);
    
    // Clients
    Route::apiResource('clients', ClientController::class);
    
    // Commandes / Ventes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);
    Route::patch('/orders/{order}/payment', [OrderController::class, 'updatePayment']);
    Route::get('/orders/{order}/invoice', [OrderController::class, 'downloadInvoice']);

    // Abonnements
    Route::get('/subscriptions/current', [SubscriptionController::class, 'current']);
    Route::post('/subscriptions/subscribe', [SubscriptionController::class, 'subscribe']);

    // Export Data (Excel/CSV)
    Route::get('/export/products', [App\Http\Controllers\Api\ExportController::class, 'exportProducts']);
    Route::get('/export/orders', [App\Http\Controllers\Api\ExportController::class, 'exportOrders']);

    // Statistiques Commerçant
    Route::get('/stats/merchant', [StatsController::class, 'merchantStats']);

    // Notifications et Alertes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/alerts/payments', [AlertController::class, 'getPaymentAlerts']);
    Route::get('/alerts/debt-stats', [AlertController::class, 'getDebtStats']);

    // Annonces / Bannières
    Route::get('/announcements', [AnnouncementController::class, 'index']);

    // Routes d'administration
    Route::middleware('admin')->group(function () {
        Route::post('/offers', [OfferController::class, 'store']);
        Route::put('/offers/{offer}', [OfferController::class, 'update']);
        Route::delete('/offers/{offer}', [OfferController::class, 'destroy']);
        
        Route::get('/admin/announcements', [AnnouncementController::class, 'adminIndex']);
Route::apiResource('pricing-rules', PricingRuleController::class);
        Route::apiResource('admin/announcements', AnnouncementController::class)->except(['index']);
        
        Route::get('/admin/subscriptions', [SubscriptionController::class, 'index']);
        Route::get('/admin/stats', [StatsController::class, 'adminStats']);
        Route::get('/admin/users', [AuthController::class, 'index']);
        Route::post('/admin/sub-admins', [AuthController::class, 'storeAdmin']);
        Route::put('/admin/sub-admins/{id}', [AuthController::class, 'updateAdmin']);
        Route::delete('/admin/sub-admins/{id}', [AuthController::class, 'destroyAdmin']);
        Route::get('/admin/settings', [AppSettingController::class, 'index']);
        Route::get('/admin/settings/{key}', [AppSettingController::class, 'show']);
        Route::put('/admin/settings/{key}', [AppSettingController::class, 'update']);
    });
});
