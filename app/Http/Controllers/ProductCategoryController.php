<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;

class ProductCategoryController extends Controller
{
    //
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string'
        ]);
        $productCategory = ProductCategory::create([
            'name' => $request->name
        ]);

        return redirect()->back();
    }
}
