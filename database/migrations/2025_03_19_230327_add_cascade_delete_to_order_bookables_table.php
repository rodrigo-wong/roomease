<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCascadeDeleteToOrderBookablesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('order_bookables', function (Blueprint $table) {
            
            // Re-add the foreign key with cascade on delete.
            $table->foreign('order_id')
                  ->references('id')
                  ->on('orders')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('order_bookables', function (Blueprint $table) {
            // Drop the foreign key with cascade on delete.
            $table->dropForeign(['order_id']);
            
            // Optionally, re-add the foreign key with your original onDelete behavior (e.g. restrict).
            $table->foreign('order_id')
                  ->references('id')
                  ->on('orders')
                  ->onDelete('restrict');
        });
    }
}
