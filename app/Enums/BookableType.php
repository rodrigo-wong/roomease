<?php

namespace App\Enums;

enum BookableType: string
{
    case CONTRACTOR = 'contractor';
    case ROOM = 'room';
    case PRODUCT = 'product';
}
