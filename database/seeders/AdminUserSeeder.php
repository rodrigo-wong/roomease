<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create initial admin user 
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@roomease.com',
            'password' => Hash::make('admin123!'),
            'email_verified_at' => now(),
        ]);
    }
}
