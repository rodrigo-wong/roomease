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
        Schema::table('product_categories', function (Blueprint $table) {
            // Check if the column does not exist before adding it
            if (!DB::getSchemaBuilder()->hasColumn('product_categories', 'name')) {
                $table->string('name', 255)->unique();
            } else {
                $table->string('name', 255)->unique()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            if (DB::getSchemaBuilder()->hasColumn('product_categories', 'name')) {
                $table->dropUnique(['name']); // Drop unique constraint before altering
                $table->dropColumn('name');
            }
        });
    }
};
