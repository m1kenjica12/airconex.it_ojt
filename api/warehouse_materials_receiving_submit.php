<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

ini_set('display_errors', 0);
ini_set('log_errors', 1);

try {
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'alpha0.2_airconex';

    $mysqli = new mysqli($host, $username, $password, $database);

    if ($mysqli->connect_error) {
        throw new Exception("Database connection failed: " . $mysqli->connect_error);
    }

    $mysqli->set_charset("utf8mb4");

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception("Invalid JSON data received");
    }

    if (empty($data['poNumber']) || empty($data['drNumber']) || empty($data['drDate']) || empty($data['items'])) {
        throw new Exception("Missing required fields");
    }

    $mysqli->begin_transaction();

    $totalReceived = 0;
    $receivedItems = [];

    foreach ($data['items'] as $item) {
        // Update materials inventory - ADD to material_receipt
        $updateStmt = $mysqli->prepare("UPDATE materials SET material_receipt = material_receipt + ? WHERE description = ? AND uom = ?");
        
        if (!$updateStmt) {
            throw new Exception("Prepare failed: " . $mysqli->error);
        }
        
        $updateStmt->bind_param("iss", $item['received_qty'], $item['material'], $item['unit']);
        
        if (!$updateStmt->execute() || $updateStmt->affected_rows == 0) {
            // If material doesn't exist, create new record
            $insertStmt = $mysqli->prepare("INSERT INTO materials (description, uom, material_receipt, beg_inv, ending_inv) VALUES (?, ?, ?, 0, ?)");
            
            if (!$insertStmt) {
                throw new Exception("Insert prepare failed: " . $mysqli->error);
            }
            
            $insertStmt->bind_param("ssii", $item['material'], $item['unit'], $item['received_qty'], $item['received_qty']);
            
            if (!$insertStmt->execute()) {
                throw new Exception("Failed to insert material inventory: " . $insertStmt->error);
            }
            $insertStmt->close();
        }
        $updateStmt->close();

        $totalReceived += $item['received_qty'];
        
        $receivedItems[] = [
            'material' => $item['material'],
            'category' => $item['category'],
            'unit' => $item['unit'],
            'ordered_qty' => $item['ordered_qty'],
            'received_qty' => $item['received_qty']
        ];
    }

    $mysqli->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Materials received successfully',
        'data' => [
            'po_number' => $data['poNumber'],
            'dr_number' => $data['drNumber'],
            'dr_date' => $data['drDate'],
            'total_items' => count($data['items']),
            'received_items' => $receivedItems
        ]
    ]);

    $mysqli->close();

} catch (Exception $e) {
    if (isset($mysqli)) {
        $mysqli->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => 'Failed to submit receiving data'
    ]);
}
?>