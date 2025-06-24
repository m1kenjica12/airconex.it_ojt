<?php

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Start output buffering to catch any errors
ob_start();

try {
    // Log the request
    error_log("=== SALES ORDER SUBMISSION START ===");
    error_log("REQUEST METHOD: " . $_SERVER['REQUEST_METHOD']);
    error_log("POST DATA: " . print_r($_POST, true));
    
    // Check if it's a POST request
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method allowed');
    }
    
    // Database configuration
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'alpha0.2_airconex';
    
    // Test database connection
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$database;charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        error_log("Database connection successful");
    } catch (PDOException $e) {
        throw new Exception("Database connection failed: " . $e->getMessage());
    }
    
    // Check required fields
    $required = ['client_name', 'contact_number', 'city_province', 'address'];
    $missing = [];
    
    foreach ($required as $field) {
        if (empty($_POST[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        throw new Exception("Missing required fields: " . implode(', ', $missing));
    }
    
    // Generate SO number with new format: SO{STORE_CODE}-{YY}{SEQUENCE}
    $year = date('y'); // 2-digit year
    $storeCode = $_POST['store_code'] ?? '1';
    
    // Get the last SO number for this store and year
    $sql = "SELECT so_number FROM sales_orders WHERE so_number LIKE ? ORDER BY created_at DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(["SO0{$storeCode}-{$year}%"]);
    $lastSO = $stmt->fetchColumn();
    
    if ($lastSO) {
        // Extract the sequence number and increment
        $sequence = intval(substr($lastSO, -4)) + 1;
    } else {
        $sequence = 1;
    }
    
    $soNumber = sprintf("SO0%s-%s-%04d", $storeCode, $year, $sequence);
    error_log("Generated SO Number: " . $soNumber);
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Validate stock availability and prepare stock/allocation updates BEFORE creating the order
    $stockUpdates = [];
    if (isset($_POST['products']) && is_array($_POST['products'])) {
        error_log("Validating stock for products: " . print_r($_POST['products'], true));
        
        foreach ($_POST['products'] as $product) {
            if (!empty($product['brand']) && !empty($product['unit_description'])) {
                $requestedQty = max(1, intval($product['quantity'] ?? 1));
                
                // Check current stock and allocated quantities
                $stockSql = "SELECT stocks, allocated FROM products WHERE brand = ? AND unit_description = ? LIMIT 1";
                $stockStmt = $pdo->prepare($stockSql);
                $stockStmt->execute([trim($product['brand']), trim($product['unit_description'])]);
                $stockData = $stockStmt->fetch();
                
                if ($stockData === false) {
                    throw new Exception("Product not found: {$product['brand']} - {$product['unit_description']}");
                }
                
                $currentStock = intval($stockData['stocks']);
                $currentAllocated = intval($stockData['allocated'] ?? 0);
                
                // Check if enough stock is available
                if ($currentStock < $requestedQty) {
                    throw new Exception("Insufficient stock for {$product['brand']} - {$product['unit_description']}. Available: {$currentStock}, Requested: {$requestedQty}");
                }
                
                // Store stock update info - REDUCE STOCK, INCREASE ALLOCATED
                $stockUpdates[] = [
                    'brand' => trim($product['brand']),
                    'unit_description' => trim($product['unit_description']),
                    'quantity' => $requestedQty,
                    'current_stock' => $currentStock,
                    'current_allocated' => $currentAllocated,
                    'new_stock' => $currentStock - $requestedQty,  // REDUCE STOCK
                    'new_allocated' => $currentAllocated + $requestedQty,  // INCREASE ALLOCATED
                    'stock_remaining' => $currentStock - $requestedQty
                ];
                
                error_log("Stock validation passed for: {$product['brand']} - {$product['unit_description']} (Current Stock: {$currentStock}, Current Allocated: {$currentAllocated}, Requesting: {$requestedQty}, New Stock: " . ($currentStock - $requestedQty) . ", New Allocated: " . ($currentAllocated + $requestedQty) . ")");
            }
        }
    }
    
    // Insert sales order
    $sql = "INSERT INTO sales_orders (
        so_number, store, store_code, account, status, book_date, 
        installation_date, month, client_type, client_name, address, 
        city_province, contact_number, application_type, scope_of_work, 
        mode_of_payment, scheme, remarks, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $params = [
        $soNumber,
        $_POST['store'] ?? null,
        $_POST['store_code'] ?? null,
        $_POST['account'] ?? null,
        $_POST['project_status'] ?? 'For Request',
        $_POST['book_date'] ?? null,
        $_POST['installation_date'] ?? null,
        $_POST['month'] ?? null,
        $_POST['client_type'] ?? null,
        $_POST['client_name'] ?? null,
        $_POST['address'] ?? null,
        $_POST['city_province'] ?? null,
        $_POST['contact_number'] ?? null,
        $_POST['application_type'] ?? null,
        $_POST['scope_of_work'] ?? null,
        $_POST['mode_of_payment'] ?? null,
        $_POST['scheme'] ?? null,
        $_POST['remarks'] ?? null
    ];
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orderId = $pdo->lastInsertId();
    
    error_log("Sales order inserted with ID: " . $orderId);
    
    // Insert products into sales_orders_units and update stock/allocated quantities
    $productCount = 0;
    foreach ($stockUpdates as $update) {
        // Get additional product details from products table
        $productDetails = getProductDetails($pdo, $update['brand'], $update['unit_description']);
        
        // Insert into sales_orders_units with ALL columns
        $unitSql = "INSERT INTO sales_orders_units (
            sales_order_id, 
            brand, 
            unit_description, 
            unit_type, 
            indoor_model, 
            outdoor_model, 
            horsepower, 
            quantity, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $unitParams = [
            $orderId,
            $update['brand'],
            $update['unit_description'],
            $productDetails['unit_type'],
            $productDetails['indoor_model'],
            $productDetails['outdoor_model'],
            $productDetails['horsepower'],
            $update['quantity']
        ];
        
        $unitStmt = $pdo->prepare($unitSql);
        $unitStmt->execute($unitParams);
        
        // Update stock (REDUCE) and allocated (INCREASE) quantities in products table
        $updateStockSql = "UPDATE products SET stocks = ?, allocated = ? WHERE brand = ? AND unit_description = ?";
        $updateStockStmt = $pdo->prepare($updateStockSql);
        $updateStockStmt->execute([
            $update['new_stock'],      // REDUCED STOCK
            $update['new_allocated'],  // INCREASED ALLOCATED
            $update['brand'],
            $update['unit_description']
        ]);
        
        $productCount++;
        
        error_log("Inserted product and updated stock/allocation: Brand=" . $update['brand'] . 
                 ", Unit=" . $update['unit_description'] . 
                 ", Type=" . $productDetails['unit_type'] . 
                 ", Indoor=" . $productDetails['indoor_model'] . 
                 ", Outdoor=" . $productDetails['outdoor_model'] . 
                 ", HP=" . $productDetails['horsepower'] . 
                 ", Qty=" . $update['quantity'] . 
                 ", Old Stock=" . $update['current_stock'] . 
                 ", New Stock=" . $update['new_stock'] . 
                 ", Old Allocated=" . $update['current_allocated'] . 
                 ", New Allocated=" . $update['new_allocated'] . 
                 ", Stock Remaining=" . $update['stock_remaining']);
    }
    
    error_log("Inserted $productCount products and updated their stock/allocation levels");
    
    // Validate that at least one product was inserted
    if ($productCount === 0) {
        throw new Exception("At least one product is required");
    }
    
    // Commit transaction
    $pdo->commit();
    
    // Clean output buffer
    ob_clean();
    
    // Return success response with stock update info
    echo json_encode([
        'success' => true,
        'message' => 'Sales order created successfully! Stock reduced and units allocated.',
        'so_number' => $soNumber,
        'order_id' => $orderId,
        'products_added' => $productCount,
        'stock_updates' => $stockUpdates
    ]);
    
    error_log("=== SALES ORDER SUBMISSION SUCCESS ===");

} catch (Exception $e) {
    // Rollback transaction if active
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
        error_log("Transaction rolled back due to error");
    }
    
    // Clean output buffer
    ob_clean();
    
    // Log the error
    error_log("ERROR: " . $e->getMessage());
    error_log("FILE: " . $e->getFile());
    error_log("LINE: " . $e->getLine());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]
    ]);
    
} catch (Error $e) {
    // Handle fatal errors
    ob_clean();
    
    error_log("FATAL ERROR: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Fatal error: ' . $e->getMessage(),
        'debug' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}

// Helper function to get product details from products table
function getProductDetails($pdo, $brand, $unitDescription) {
    try {
        // Query to get all product details from products table
        $sql = "SELECT 
                    unit_type, 
                    indoor_model, 
                    outdoor_model,
                    horsepower
                FROM products 
                WHERE brand = ? AND unit_description = ? 
                LIMIT 1";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$brand, $unitDescription]);
        $result = $stmt->fetch();
        
        if ($result) {
            error_log("Found product details: " . print_r($result, true));
            return [
                'unit_type' => $result['unit_type'],
                'indoor_model' => $result['indoor_model'],
                'outdoor_model' => $result['outdoor_model'],
                'horsepower' => $result['horsepower']
            ];
        } else {
            // Try alternative query with just unit_description if brand+unit doesn't match
            $sql2 = "SELECT 
                        unit_type, 
                        indoor_model, 
                        outdoor_model,
                        horsepower
                    FROM products 
                    WHERE unit_description = ? 
                    LIMIT 1";
            
            $stmt2 = $pdo->prepare($sql2);
            $stmt2->execute([$unitDescription]);
            $result2 = $stmt2->fetch();
            
            if ($result2) {
                error_log("Found product details (by unit only): " . print_r($result2, true));
                return [
                    'unit_type' => $result2['unit_type'],
                    'indoor_model' => $result2['indoor_model'],
                    'outdoor_model' => $result2['outdoor_model'],
                    'horsepower' => $result2['horsepower']
                ];
            } else {
                // Return defaults if product not found
                error_log("Product not found in products table: Brand=$brand, Unit=$unitDescription");
                return [
                    'unit_type' => null,
                    'indoor_model' => null,
                    'outdoor_model' => null,
                    'horsepower' => null
                ];
            }
        }
    } catch (Exception $e) {
        error_log("Error getting product details: " . $e->getMessage());
        // Return defaults on error
        return [
            'unit_type' => null,
            'indoor_model' => null,
            'outdoor_model' => null,
            'horsepower' => null
        ];
    }
}

// End output buffering
ob_end_flush();
?>