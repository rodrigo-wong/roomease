<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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

        // After creating a new product category, invalidate the products cache
        Cache::forget('products');

        return redirect()->back();
    }
}
