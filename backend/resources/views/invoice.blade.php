<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture #{{ $order->id }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #333;
            padding: 20px 30px 20px 30px; /* Reduced bottom padding significantly */
            font-size: 10px; /* Reduced base font size */
            position: relative;
            min-height: 100%;
        }
        .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px; /* Reduced margin */
            border-bottom: 2px solid #6A8EFE; /* Thinner border */
            padding-bottom: 10px; /* Reduced padding */
        }
        .company-info {
            flex: 1;
        }
        .company-name {
            font-size: 20px; /* Smaller title */
            font-weight: bold;
            color: #6A8EFE;
            margin-bottom: 5px;
        }
        .company-details {
            font-size: 9px; /* Smaller details */
            color: #666;
            line-height: 1.4;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-title {
            font-size: 22px; /* Smaller invoice title */
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .invoice-number {
            font-size: 11px;
            color: #666;
            margin-bottom: 2px;
        }
        .invoice-date {
            font-size: 10px;
            color: #999;
        }
        .client-section {
            margin-bottom: 15px; /* Reduced margin */
            background: #f8f9fa;
            padding: 10px; /* Reduced padding */
            border-radius: 6px;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #6A8EFE;
            margin-bottom: 4px;
            text-transform: uppercase;
        }
        .client-name {
            font-size: 12px;
            font-weight: bold;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .items-table thead {
            background: #6A8EFE;
            color: white;
        }
        .items-table th {
            padding: 6px 8px; /* Reduced padding */
            text-align: left;
            font-size: 9px; /* Smaller header font */
            font-weight: bold;
            text-transform: uppercase;
        }
        .items-table td {
            padding: 6px 8px; /* Reduced padding */
            border-bottom: 1px solid #e5e7eb;
            font-size: 9px; /* Smaller cell font */
        }
        .items-table tbody tr:hover {
            background: #f8f9fa;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-section {
            margin-left: auto;
            width: 250px; /* More compact total section */
            border: 1px solid #e5e7eb; /* Thinner border */
            border-radius: 6px;
            overflow: hidden;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 10px; /* Reduced padding */
            border-bottom: 1px solid #e5e7eb;
        }
        .total-row:last-child {
            border-bottom: none;
        }
        .total-label {
            font-size: 10px;
            color: #666;
        }
        .total-value {
            font-size: 10px;
            font-weight: bold;
            color: #333;
        }
        .grand-total {
            background: #6A8EFE;
            color: white;
        }
        .grand-total .total-label,
        .grand-total .total-value {
            color: white;
            font-size: 12px;
        }
        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-paid {
            background: #e0e7ff;
            color: #4338ca;
        }
        .status-partial {
            background: #fef3c7;
            color: #92400e;
        }
        .status-credit {
            background: #fee2e2;
            color: #991b1b;
        }
        .product-img {
            width: 25px; /* Smaller image */
            height: 25px;
            border-radius: 3px;
            margin-right: 6px;
            vertical-align: middle;
            object-fit: cover;
        }
        .footer {
            position: absolute;
            bottom: 20px;
            left: 40px;
            right: 40px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .footer-logos {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
        }
        .footer-logo {
            height: 40px;
            margin: 0 10px;
        }
        .by-logo {
            height: 20px;
            margin: 0 10px;
        }
        .payment-info {
            margin-top: 20px;
            padding: 0;
        }
        .payment-info-title {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="company-name">{{ $shop->name }}</div>
            <div class="company-details">
                @if($shop->address)
                    <div>Adresse: {{ $shop->address }}</div>
                @endif
                @if($shop->phone)
                    <div>Tel: {{ $shop->phone }}</div>
                @endif
            </div>
        </div>
        <div class="invoice-info">
            <div class="invoice-title">FACTURE</div>
            <div class="invoice-number">#{{ str_pad($order->id, 6, '0', STR_PAD_LEFT) }}</div>
            <div class="invoice-date">{{ \Carbon\Carbon::parse($order->created_at)->format('d/m/Y à H:i') }}</div>
            <div style="margin-top: 10px;">
                @if($order->status === 'paid')
                    <span class="status-badge status-paid">Paye</span>
                @elseif($order->status === 'partial')
                    <span class="status-badge status-partial">Paiement Partiel</span>
                @else
                    <span class="status-badge status-credit">A Credit</span>
                @endif
            </div>
        </div>
    </div>

    <div class="client-section" style="padding: 10px; margin-bottom: 15px;">
        <span class="section-title" style="margin-bottom: 0; margin-right: 10px;">Client :</span>
        <span class="client-name">{{ $order->client ? $order->client->name : 'Client anonyme' }}</span>
        @if($order->client && $order->client->phone)
            <span style="font-size: 10px; color: #666; margin-left: 15px;">Tel: {{ $order->client->phone }}</span>
        @endif
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Produit</th>
                <th class="text-center" style="width: 15%;">Quantité</th>
                <th class="text-right" style="width: 17.5%;">Prix Unit.</th>
                <th class="text-right" style="width: 17.5%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td style="padding: 6px 8px;">
                    @if($item->product && isset($item->product->base64_image))
                        <img src="{{ $item->product->base64_image }}" class="product-img">
                    @endif
                    <div style="display: inline-block; vertical-align: middle;">
                        <strong>{{ $item->product ? $item->product->name : 'Produit supprime' }}</strong>
                        @if($item->product && $item->product->description)
                            <div style="font-size: 8px; color: #999; margin-top: 2px;">{{ Str::limit($item->product->description, 50) }}</div>
                        @endif
                    </div>
                </td>
                <td class="text-center" style="padding: 6px 8px;">{{ $item->quantity }}</td>
                <td class="text-right" style="padding: 6px 8px;">{{ number_format($item->unit_price, 0, ',', ' ') }} XOF</td>
                <td class="text-right" style="padding: 6px 8px;"><strong>{{ number_format($item->unit_price * $item->quantity, 0, ',', ' ') }} XOF</strong></td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Infos de règlement --}}
    <div style="margin-left: auto; width: 250px; margin-bottom: 10px; text-align: right; padding-right: 5px;">
        @if($order->payment_date)
            <div style="font-size: 9px; margin-bottom: 3px;">
                <strong style="color: #333;">Date de régl. :</strong> 
                <span style="color: #10B981; font-weight: bold;">{{ \Carbon\Carbon::parse($order->payment_date)->format('d/m/Y') }}</span>
            </div>
        @endif

        @if($order->status !== 'paid' && $order->payment_due_date)
            <div style="font-size: 9px; margin-bottom: 3px;">
                <strong style="color: #333;">Échéance :</strong> 
                <span style="color: #EF4444;">{{ \Carbon\Carbon::parse($order->payment_due_date)->format('d/m/Y') }}</span>
            </div>
        @endif

        @if($order->debt_notes)
            <div style="font-size: 9px; color: #666; margin-top: 3px;">
                <strong>Note :</strong> {{ $order->debt_notes }}
            </div>
        @endif
    </div>

    <div class="totals-section">
        <div class="total-row">
            <span class="total-label">Sous-total</span>
            <span class="total-value">{{ number_format($order->total_amount, 0, ',', ' ') }} XOF</span>
        </div>
        <div class="total-row">
            <span class="total-label">Montant payé</span>
            <span class="total-value" style="color: #6A8EFE;">{{ number_format($order->paid_amount, 0, ',', ' ') }} XOF</span>
        </div>
        @if($order->status !== 'paid')
        <div class="total-row">
            <span class="total-label">Reste à payer</span>
            <span class="total-value" style="color: #EF4444;">{{ number_format($order->total_amount - $order->paid_amount, 0, ',', ' ') }} XOF</span>
        </div>
        @endif
        <div class="total-row grand-total">
            <span class="total-label">TOTAL</span>
            <span class="total-value">{{ number_format($order->total_amount, 0, ',', ' ') }} XOF</span>
        </div>
    </div>

    <div class="footer">
        <p>Merci pour votre confiance !</p>
        
        <div style="margin-top: 15px; text-align: center;">
            <div style="margin-bottom: 5px;">
                <img src="{{ public_path('storage/app_image.png') }}" style="height: 30px;">
            </div>
            
            <div style="margin-top: 10px;">
                <p style="font-size: 7px; color: #bbb; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;">Powered by</p>
                <img src="{{ public_path('storage/by.png') }}" style="height: 12px; opacity: 0.7;">
            </div>
        </div>

        <p style="margin-top: 10px; font-size: 8px;">Généré le {{ now()->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
