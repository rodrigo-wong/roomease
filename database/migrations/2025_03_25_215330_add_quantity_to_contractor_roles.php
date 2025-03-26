<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add the quantity column to contractor_roles with a default value of 0.
        Schema::table('contractor_roles', function (Blueprint $table) {
            $table->integer('quantity')->default(0);
        });

        // Update existing contractor_roles with the current count of contractors per role.
        DB::statement('
            UPDATE contractor_roles cr
            SET cr.quantity = (
                SELECT COUNT(*) 
                FROM contractors c
                WHERE c.role_id = cr.id
            )
        ');

        // Create a trigger to update quantity after a contractor is inserted.
        DB::unprepared('
            CREATE TRIGGER contractor_after_insert
            AFTER INSERT ON contractors
            FOR EACH ROW
            BEGIN
                UPDATE contractor_roles
                SET quantity = quantity + 1
                WHERE id = NEW.role_id;
            END
        ');

        // Create a trigger to update quantity after a contractor is deleted.
        DB::unprepared('
            CREATE TRIGGER contractor_after_delete
            AFTER DELETE ON contractors
            FOR EACH ROW
            BEGIN
                UPDATE contractor_roles
                SET quantity = quantity - 1
                WHERE id = OLD.role_id;
            END
        ');
    }

    public function down(): void
    {
        // Remove the quantity column.
        Schema::table('contractor_roles', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });

        // Drop the triggers.
        DB::unprepared('DROP TRIGGER IF EXISTS contractor_after_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS contractor_after_delete');
    }
};
