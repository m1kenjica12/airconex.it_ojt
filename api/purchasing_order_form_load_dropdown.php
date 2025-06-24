<?php
// filepath: c:\xampp\htdocs\alpha0.2_airconex\api\products_load.php

// Set headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Disable HTML error output for JSON API
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any stray output
ob_start();

try {
    // Database configuration
    $host = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'alpha0.2_airconex';

    // Create connection
    $mysqli = new mysqli($host, $username, $password, $database);

    // Check connection
    if ($mysqli->connect_error) {
        throw new Exception("Database connection failed: " . $mysqli->connect_error);
    }

    // Set charset
    $mysqli->set_charset("utf8mb4");

    // Get distinct brands
    $brandsQuery = "SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand";
    $brandsResult = $mysqli->query($brandsQuery);
    if (!$brandsResult) {
        throw new Exception("Brands query failed: " . $mysqli->error);
    }
    
    $brands = [];
    while ($row = $brandsResult->fetch_assoc()) {
        $brands[] = $row['brand'];
    }

    // Get distinct horsepower values
    $horsepowerQuery = "SELECT DISTINCT horsepower FROM products WHERE horsepower IS NOT NULL AND horsepower != '' ORDER BY CAST(horsepower AS DECIMAL(3,2))";
    $horsepowerResult = $mysqli->query($horsepowerQuery);
    if (!$horsepowerResult) {
        throw new Exception("Horsepower query failed: " . $mysqli->error);
    }
    
    $horsepower = [];
    while ($row = $horsepowerResult->fetch_assoc()) {
        $horsepower[] = $row['horsepower'];
    }

    // Get distinct unit types
    $unitTypesQuery = "SELECT DISTINCT unit_type FROM products WHERE unit_type IS NOT NULL AND unit_type != '' ORDER BY unit_type";
    $unitTypesResult = $mysqli->query($unitTypesQuery);
    if (!$unitTypesResult) {
        throw new Exception("Unit types query failed: " . $mysqli->error);
    }
    
    $unitTypes = [];
    while ($row = $unitTypesResult->fetch_assoc()) {
        $unitTypes[] = $row['unit_type'];
    }

    // Get distinct series
    $seriesQuery = "SELECT DISTINCT series FROM products WHERE series IS NOT NULL AND series != '' ORDER BY series";
    $seriesResult = $mysqli->query($seriesQuery);
    if (!$seriesResult) {
        throw new Exception("Series query failed: " . $mysqli->error);
    }
    
    $series = [];
    while ($row = $seriesResult->fetch_assoc()) {
        $series[] = $row['series'];
    }

    // Get full product data for dynamic filtering
    $productsQuery = "SELECT 
                        brand,
                        horsepower,
                        unit_type,
                        series,
                        indoor_model,
                        outdoor_model
                      FROM products 
                      WHERE brand IS NOT NULL 
                        AND horsepower IS NOT NULL 
                        AND unit_type IS NOT NULL 
                        AND series IS NOT NULL
                      ORDER BY brand, horsepower, series, unit_type";
    
    $productsResult = $mysqli->query($productsQuery);
    if (!$productsResult) {
        throw new Exception("Products query failed: " . $mysqli->error);
    }
    
    $products = [];
    while ($row = $productsResult->fetch_assoc()) {
        $products[] = $row;
    }

    // Build hierarchical structure for dynamic dropdowns
    $productHierarchy = [];
    foreach ($products as $product) {
        $brand = $product['brand'];
        $hp = $product['horsepower'];
        $seriesName = $product['series'];
        $unitType = $product['unit_type'];
        
        if (!isset($productHierarchy[$brand])) {
            $productHierarchy[$brand] = [];
        }
        if (!isset($productHierarchy[$brand][$hp])) {
            $productHierarchy[$brand][$hp] = [];
        }
        if (!isset($productHierarchy[$brand][$hp][$seriesName])) {
            $productHierarchy[$brand][$hp][$seriesName] = [];
        }
        if (!isset($productHierarchy[$brand][$hp][$seriesName][$unitType])) {
            $productHierarchy[$brand][$hp][$seriesName][$unitType] = [
                'indoor_model' => $product['indoor_model'],
                'outdoor_model' => $product['outdoor_model']
            ];
        }
    }

    $response = [
        'success' => true,
        'data' => [
            'brands' => $brands,
            'horsepower' => $horsepower,
            'unit_types' => $unitTypes,
            'series' => $series,
            'products' => $products,
            'hierarchy' => $productHierarchy
        ],
        'counts' => [
            'brands' => count($brands),
            'horsepower' => count($horsepower),
            'unit_types' => count($unitTypes),
            'series' => count($series),
            'products' => count($products)
        ]
    ];

    // Close connection
    $mysqli->close();

    // Clear any output buffer and send JSON
    ob_clean();
    echo json_encode($response);

} catch (Exception $e) {
    // Clear any output buffer
    ob_clean();
    
    // Log error
    error_log("PRODUCTS API ERROR: " . $e->getMessage());
    
    // Send error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => 'Database connection or query failed'
    ]);
}
?>