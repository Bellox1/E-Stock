<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/contact', function (Request $request) {
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'subject' => 'required|string|max:255',
        'message' => 'required|string',
    ]);

    // Send email
    // Note: ensure MAIL_FROM_ADDRESS is set in .env
    $to = env('MAIL_FROM_ADDRESS', 'admin@example.com');
    
    Mail::raw("Nom: {$validated['name']}\nEmail: {$validated['email']}\n\nMessage:\n{$validated['message']}", function ($message) use ($validated, $to) {
        $message->to($to)
                ->subject('Contact GestionStock: ' . $validated['subject'])
                ->replyTo($validated['email'], $validated['name']);
    });

    return redirect('/#contact')->with('success', 'Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.');
})->name('contact.send');
