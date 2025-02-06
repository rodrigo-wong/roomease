<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ContractorRole;

class ContractorRoleController extends Controller
{
    //
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

        return redirect()->back();
    }
}
