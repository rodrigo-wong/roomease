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
        Schema::create('order_bookables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->onDelete('cascade');
            $table->foreignId('bookable_id')->onDelete('cascade'); // Points to bookables table
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_bookables');
    }
};
