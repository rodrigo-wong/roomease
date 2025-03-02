<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case ADMIN_RESERVED = 'admin_reserved';

    public static function values(): array
    {
        return [
            self::PENDING,
            self::PROCESSING,
            self::COMPLETED,
            self::CANCELLED,
            self::ADMIN_RESERVED,
        ];
    }
}
