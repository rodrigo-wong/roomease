<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;


return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_bookables_status_enum', function (Blueprint $table) {
            DB::statement("ALTER TABLE order_bookables MODIFY status ENUM('pending', 'confirmed', 'cancelled', 'admin_blocked') NOT NULL DEFAULT 'pending'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_bookables_status_enum', function (Blueprint $table) {
            DB::statement("ALTER TABLE order_bookables MODIFY status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending'");
        });
    }
};
