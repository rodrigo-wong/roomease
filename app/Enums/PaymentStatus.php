<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case PENDING = 'pending';
    case SUCCEEDED = 'succeeded';
    case FAILED = 'failed';

    public static function values(): array
    {
        return [
            self::PENDING,
            self::SUCCEEDED,
            self::FAILED,
        ];
    }
}
