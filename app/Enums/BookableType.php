<?php

namespace App\Enums;

enum BookableType: string
{
    case CONTRACTOR = 'contractor';
    case ROOM = 'room';
    case PRODUCT = 'product';
    case ROOM_GROUP = 'room_group';

    public static function values(): array
    {
        return [
            self::CONTRACTOR,
            self::ROOM,
            self::PRODUCT,
        ];
    }
}
