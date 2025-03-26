<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Trigger for Rooms: After a room is deleted, delete its associated bookable record.
        DB::unprepared('
            CREATE TRIGGER delete_bookable_for_room
            AFTER DELETE ON rooms
            FOR EACH ROW
            BEGIN
                DELETE FROM bookables
                WHERE id = OLD.bookable_id;
            END
        ');

        // Trigger for Contractors: After a contractor is deleted, delete its associated bookable record.
        DB::unprepared('
            CREATE TRIGGER delete_bookable_for_contractor
            AFTER DELETE ON contractors
            FOR EACH ROW
            BEGIN
                DELETE FROM bookables
                WHERE id = OLD.bookable_id;
            END
        ');

        // Trigger for Products: After a product is deleted, delete its associated bookable record.
        DB::unprepared('
            CREATE TRIGGER delete_bookable_for_product
            AFTER DELETE ON products
            FOR EACH ROW
            BEGIN
                DELETE FROM bookables
                WHERE id = OLD.bookable_id;
            END
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS delete_bookable_for_room');
        DB::unprepared('DROP TRIGGER IF EXISTS delete_bookable_for_contractor');
        DB::unprepared('DROP TRIGGER IF EXISTS delete_bookable_for_product');
    }
};
