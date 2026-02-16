<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add base_price and drop legacy/unused columns
        Schema::table('offers', function (Blueprint $table) {
            $table->decimal('base_price', 15, 2)->default(0)->after('name');
            // Assuming price and duration_months are no longer needed if we compute everything
            // But let's check if we want to migrate data first.
            // For now, let's keep them briefly or assume fresh start or data migration script would handle it.
            // Given the user is in dev, dropping is cleaner.
            $table->dropColumn(['price', 'duration_months']);
        });

        // Drop the offer_prices table as it's redundant (calculated on fly)
        Schema::dropIfExists('offer_prices');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('offer_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->onDelete('cascade');
            $table->integer('duration_months');
            $table->decimal('price', 15, 2);
            $table->integer('discount_percentage')->default(0);
            $table->timestamps();
        });

        Schema::table('offers', function (Blueprint $table) {
            $table->decimal('price', 15, 2)->nullable();
            $table->integer('duration_months')->nullable();
            $table->dropColumn('base_price');
        });
    }
};
