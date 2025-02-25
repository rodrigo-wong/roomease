<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ModifyOrderBookablesForPolymorphism extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_bookables', function (Blueprint $table) {
            // Add the bookable_type column after bookable_id
            $table->string('bookable_type')->after('bookable_id');
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_bookables', function (Blueprint $table) {
            $table->dropColumn('bookable_type');
        });
    }
}
