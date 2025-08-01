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
            'name' => env('DEFAULT_ADMIN_NAME', 'Super_Admin'),
            'email' => env('DEFAULT_ADMIN_EMAIL', 'admin@roomease.com'),
            'password' => Hash::make(env('DEFAULT_ADMIN_PASSWORD', 'admin123!')),
            'role' => 'super_admin', //First user added is always a super admin
            'email_verified_at' => now(),
        ]);
    }
}
