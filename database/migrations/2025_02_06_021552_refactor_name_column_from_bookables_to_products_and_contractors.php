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
        Schema::table('bookables', function (Blueprint $table) {
            //
            $table->dropColumn('name');
            $table->dropColumn('description');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->string('name', 255)->after('bookable_id');
            $table->string('description', 255)->after('name');
        });
        Schema::table('contractors', function (Blueprint $table) {
            $table->string('name', 255)->after('bookable_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookables', function (Blueprint $table) {
            //
            $table->string('name', 255)->after('id');
            $table->string('description', 255)->after('name');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->dropColumn('description');
        });
        Schema::table('contractors', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};
