<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Attempting to create announcements table manually...\n";
Schema::create('announcements', function (Blueprint $blueprint) {
    $blueprint->id();
    $blueprint->string('title');
    $blueprint->text('content');
    $blueprint->string('image_url')->nullable();
    $blueprint->boolean('is_active')->default(true);
    $blueprint->timestamps();
});
echo "Done.\n";
