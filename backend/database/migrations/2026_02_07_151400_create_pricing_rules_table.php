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
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->integer('duration_months');
            $table->integer('discount_percentage');
            $table->timestamps();
        });

        // Seed default rules
        DB::table('pricing_rules')->insert([
            ['duration_months' => 3, 'discount_percentage' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['duration_months' => 6, 'discount_percentage' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['duration_months' => 12, 'discount_percentage' => 30, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
