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
            $table->dropColumn('role');
            $table->foreignId('role_id')->after('id')->constrained('contractor_roles')->onUpdate('cascade')->onDelete('restrict');
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
