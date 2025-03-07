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
        Schema::create('admin_invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('token', 64)->unique();
            $table->foreignId('invited_by')->constrained('users');
            $table->timestamp('accepted_at')->nullable();
            $table->dateTime('expires_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_invitations');
    }
};
