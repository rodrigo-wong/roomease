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
        Schema::table('contractor_roles', function (Blueprint $table) {
            //
            $table->decimal('rate', 10, 2)->after('description')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contractor_roles', function (Blueprint $table) {
            //
            $table->dropColumn('rate');
        });
    }
};
