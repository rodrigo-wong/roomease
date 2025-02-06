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
        Schema::table('contractors', function (Blueprint $table) {
            //
            if (Schema::hasColumn('contractors', 'role')) {
                $table->dropColumn('role');
            }

            if (!Schema::hasColumn('contractors', 'role_id')) {
                $table->foreignId('role_id')->after('id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contractors', function (Blueprint $table) {
            //
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
            $table->string('role', 255)->after('id');
        });
    }
};
