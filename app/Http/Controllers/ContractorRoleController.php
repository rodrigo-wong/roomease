<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use App\Models\ContractorRole;

class ContractorRoleController extends Controller
{
    /**
     * Store a new contractor role and invalidate related cache
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'required|string',
            'rate' => 'required|numeric'
        ]);
        $contractorRole = ContractorRole::create([
            'name' => $request->name,
            'description' => $request->description,
            'rate' => $request->rate
        ]);

        // After creating a new role, invalidate the contractorRoles cache
        Cache::forget('contractorRoles');

        return redirect()->back();
    }
}
