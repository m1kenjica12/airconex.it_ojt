<?php


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Error handling
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    // Database configuration
    $config = [
        'host' => 'localhost',
        'username' => 'root',
        'password' => '',
        'database' => 'alpha0.2_airconex',
        'charset' => 'utf8mb4'
    ];

    $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    // First, let's check what columns actually exist
    $columnsCheck = $pdo->query("DESCRIBE sales_orders");
    $columns = $columnsCheck->fetchAll();
    
    // Log the columns for debugging
    error_log("Available columns: " . print_r(array_column($columns, 'Field'), true));

    // Try different possible status column names
    $possibleStatusColumns = ['status', 'project_status', 'order_status', 'so_status'];
    $statusColumn = 'status'; // default
    
    foreach ($possibleStatusColumns as $col) {
        $found = false;
        foreach ($columns as $column) {
            if ($column['Field'] === $col) {
                $statusColumn = $col;
                $found = true;
                break;
            }
        }
        if ($found) break;
    }

    // Get sales orders with total quantity from sales_orders_units table
    $sql = "
        SELECT 
            so.so_number,
            so.store,
            so.store_code,
            so.account,
            so.{$statusColumn} as status,
            so.book_date,
            so.installation_date,
            so.month,
            so.client_type,
            so.client_name,
            so.address,
            so.city_province,
            so.contact_number,
            so.application_type,
            so.scope_of_work,
            so.mode_of_payment,
            so.scheme,
            so.remarks,
            COALESCE(SUM(sou.quantity), 0) as total_quantity
        FROM sales_orders so
        LEFT JOIN sales_orders_units sou ON so.id = sou.sales_order_id
        GROUP BY so.id, so.so_number, so.store, so.store_code, so.account, 
                 so.{$statusColumn}, so.book_date, so.installation_date, so.month,
                 so.client_type, so.client_name, so.address, so.city_province,
                 so.contact_number, so.application_type, so.scope_of_work,
                 so.mode_of_payment, so.scheme, so.remarks
        ORDER BY so.so_number DESC
    ";
    
    $stmt = $pdo->query($sql);
    $salesLogs = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $salesLogs,
        'debug' => [
            'status_column_used' => $statusColumn,
            'available_columns' => array_column($columns, 'Field')
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>

