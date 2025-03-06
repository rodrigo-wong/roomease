<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

trait CacheInvalidationTrait
{
    /**
     * Helper method to invalidate all orders-related cache entries
     * 
     * Since Laravel's database cache driver stores cache entries in a table,
     * we need a custom approach to find and delete all order-related keys
     */
    private function invalidateOrdersCache()
    {
        try {
            $cacheEntries = DB::table('cache')
                ->where('key', 'LIKE', '%orders_%')
                ->get();

            // Forget each cache entry individually
            foreach ($cacheEntries as $entry) {
                Cache::forget($entry->key);
            }
            Log::debug('Orders cache invalidated');
        } catch (\Exception $e) {
            Log::error('Failed to invalidate orders cache: ' . $e->getMessage());
        }
    }
}
