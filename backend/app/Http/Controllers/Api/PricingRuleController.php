<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use Illuminate\Http\Request;

class PricingRuleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return PricingRule::orderBy('duration_months', 'asc')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'duration_months' => 'required|integer',
            'discount_percentage' => 'required|integer',
        ]);

        return PricingRule::create($validated);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PricingRule $pricingRule)
    {
        $validated = $request->validate([
            'duration_months' => 'integer',
            'discount_percentage' => 'integer',
        ]);

        $pricingRule->update($validated);

        return $pricingRule;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PricingRule $pricingRule)
    {
        $pricingRule->delete();

        return response()->noContent();
    }
}
