<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'alpha0.2_airconex';

    $mysqli = new mysqli($host, $username, $password, $database);

    if ($mysqli->connect_error) {
        throw new Exception("Database connection failed: " . $mysqli->connect_error);
    }

    // Query to get PO data with items
    $sql = "SELECT 
                pmo.id,
                pmo.po_number,
                pmo.supplier,
                pmo.po_date,
                pmoi.id as item_id,
                pmoi.category,
                pmoi.material,
                pmoi.unit,
                pmoi.quantity
            FROM purchase_material_orders pmo
            LEFT JOIN purchase_material_order_items pmoi ON pmo.id = pmoi.purchase_material_order_id
            ORDER BY pmo.po_number, pmoi.id";
    
    $result = $mysqli->query($sql);

    if (!$result) {
        throw new Exception("Query failed: " . $mysqli->error);
    }

    $poData = [];
    
    while ($row = $result->fetch_assoc()) {
        $poNumber = $row['po_number'];
        
        if (!isset($poData[$poNumber])) {
            $poData[$poNumber] = [
                'po_number' => $row['po_number'],
                'supplier' => $row['supplier'],
                'po_date' => $row['po_date'],
                'items' => []
            ];
        }
        
        if ($row['item_id']) {
            $poData[$poNumber]['items'][] = [
                'id' => $row['item_id'],
                'category' => $row['category'],
                'material' => $row['material'],
                'unit' => $row['unit'],
                'quantity' => $row['quantity']
            ];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => array_values($poData),
        'timestamp' => date('Y-m-d H:i:s')
    ]);

    $mysqli->close();

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>