<?php

namespace App\Enums;

enum OrderBookableStatus: string
{
    case PENDING = 'pending';
    case CONFIRMED = 'confirmed';
    case CANCELLED = 'cancelled';

    public static function values(): array
    {
        return [
            self::PENDING,
            self::CONFIRMED,
            self::CANCELLED,
        ];
    }
}
