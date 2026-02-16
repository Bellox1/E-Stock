<?php

namespace Database\Seeders;

use App\Models\Announcement;
use Illuminate\Database\Seeder;

class AnnouncementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Announcement::updateOrCreate(
            ['title' => 'Nouveauté : Forfait Premium'],
            [
                'content' => 'Découvrez notre nouveau forfait Premium avec statistiques avancées !',
                'image_url' => 'https://img.freepik.com/free-vector/special-offer-modern-sale-banner-template_1017-20667.jpg',
                'is_active' => true,
            ]
        );

        Announcement::updateOrCreate(
            ['title' => 'Maintenance prévue'],
            [
                'content' => 'Une maintenance est prévue ce dimanche à 2h du matin.',
                'image_url' => 'https://img.freepik.com/free-vector/abstract-sales-banner-with-liquid-shapes_23-2148381615.jpg',
                'is_active' => true,
            ]
        );
    }
}
